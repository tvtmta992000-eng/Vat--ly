const db = require('../db');
const { parseOptions } = require('./quiz');

async function getLessonBySlug(slug, { includeDrafts = false } = {}) {
  return db.one(
    `SELECT l.*, c.title AS chapter_title, c.level AS level
       FROM lessons l JOIN chapters c ON c.id = l.chapter_id
      WHERE l.slug = ? ${includeDrafts ? '' : 'AND l.published = 1'}`,
    [slug]
  );
}

async function getQuestions(lessonId) {
  const rows = await db.query('SELECT * FROM questions WHERE lesson_id = ? ORDER BY position, id', [lessonId]);
  return rows.map((q) => ({ ...q, options: parseOptions(q) }));
}

// Trả về các chương của một cấp học kèm danh sách bài học đã xuất bản.
async function getLevelTree(level, { includeDrafts = false } = {}) {
  const chapters = await db.query('SELECT * FROM chapters WHERE level = ? ORDER BY position, id', [level]);
  if (chapters.length === 0) return [];
  const lessons = await db.query(
    `SELECT id, chapter_id, title, slug, summary, simulation, published
       FROM lessons WHERE chapter_id IN (?) ${includeDrafts ? '' : 'AND published = 1'}
      ORDER BY position, id`,
    [chapters.map((c) => c.id)]
  );
  return chapters.map((c) => ({ ...c, lessons: lessons.filter((l) => l.chapter_id === c.id) }));
}

// Bài trước/sau trong cùng cấp học, theo thứ tự chương rồi thứ tự bài.
async function getNeighbours(lesson) {
  const ordered = await db.query(
    `SELECT l.slug, l.title FROM lessons l JOIN chapters c ON c.id = l.chapter_id
      WHERE c.level = ? AND l.published = 1
      ORDER BY c.position, c.id, l.position, l.id`,
    [lesson.level]
  );
  const index = ordered.findIndex((l) => l.slug === lesson.slug);
  return {
    prev: index > 0 ? ordered[index - 1] : null,
    next: index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null,
  };
}

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180);
}

module.exports = { getLessonBySlug, getQuestions, getLevelTree, getNeighbours, slugify };
