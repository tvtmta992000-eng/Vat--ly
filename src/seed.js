const bcrypt = require('bcryptjs');
const db = require('./db');
const config = require('./config');
const sampleContent = require('./seed-data');

async function ensureAdmin() {
  const { email, password, name } = config.admin;
  if (!email || !password) return false;
  const existing = await db.one('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) return false;
  const hash = await bcrypt.hash(password, 12);
  await db.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    name,
    email.toLowerCase(),
    hash,
    'admin',
  ]);
  return true;
}

// Nhập chương/bài/câu hỏi. Chương trùng (cùng cấp + tên) được dùng lại, bài trùng slug thì bỏ qua,
// nên chạy lại nhiều lần không tạo bản sao.
async function importChapters(chapters) {
  const stats = { chapters: 0, lessons: 0, questions: 0, skipped: [] };
  for (const chapter of chapters) {
    let row = await db.one('SELECT id FROM chapters WHERE level = ? AND title = ?', [chapter.level, chapter.title]);
    if (!row) {
      const result = await db.query(
        'INSERT INTO chapters (level, title, description, position) VALUES (?, ?, ?, ?)',
        [chapter.level, chapter.title, chapter.description || null, chapter.position || 0]
      );
      row = { id: result.insertId };
      stats.chapters += 1;
    }

    for (const [lessonIndex, lesson] of chapter.lessons.entries()) {
      if (await db.one('SELECT id FROM lessons WHERE slug = ?', [lesson.slug])) {
        stats.skipped.push(lesson.slug);
        continue;
      }
      const lessonResult = await db.query(
        `INSERT INTO lessons (chapter_id, title, slug, summary, content_md, simulation, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [row.id, lesson.title, lesson.slug, lesson.summary, lesson.content.trim(), lesson.simulation || null, lessonIndex]
      );
      stats.lessons += 1;
      for (const [qIndex, q] of (lesson.questions || []).entries()) {
        await db.query(
          `INSERT INTO questions (lesson_id, prompt_md, options_json, correct_index, explanation_md, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [lessonResult.insertId, q.prompt, JSON.stringify(q.options), q.answer, q.explanation || null, qIndex]
        );
        stats.questions += 1;
      }
    }
  }
  return stats;
}

// Xoá các bài theo slug, sau đó xoá những chương không còn bài nào.
async function removeLessons(slugs) {
  if (slugs.length === 0) return 0;
  const result = await db.query('DELETE FROM lessons WHERE slug IN (?)', [slugs]);
  await db.query('DELETE FROM chapters WHERE id NOT IN (SELECT DISTINCT chapter_id FROM lessons)');
  return result.affectedRows;
}

const sampleLessonSlugs = () => sampleContent.flatMap((c) => c.lessons.map((l) => l.slug));

// Chỉ thêm nội dung mẫu khi chưa có chương nào, để không ghi đè nội dung thật.
async function seedSampleContent() {
  const { count } = await db.one('SELECT COUNT(*) AS count FROM chapters');
  if (count > 0) return false;
  await importChapters(sampleContent);
  return true;
}

module.exports = { ensureAdmin, seedSampleContent, importChapters, removeLessons, sampleLessonSlugs };
