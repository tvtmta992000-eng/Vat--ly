const express = require('express');
const db = require('../db');
const { LEVELS, getLevel } = require('../levels');
const { SIMULATIONS, getSimulation, groupedSimulations } = require('../simulations');

const FEATURED_SIMULATIONS = ['collision', 'interference', 'gas', 'induction', 'lens', 'resonance'].map(getSimulation);
const { render } = require('../lib/markdown');
const { getLessonBySlug, getQuestions, getLevelTree, getNeighbours } = require('../lib/content');

const router = express.Router();

router.get('/', async (req, res) => {
  const counts = await db.query(
    `SELECT c.level, COUNT(l.id) AS lessons
       FROM chapters c LEFT JOIN lessons l ON l.chapter_id = c.id AND l.published = 1
      GROUP BY c.level`
  );
  const countByLevel = Object.fromEntries(counts.map((c) => [c.level, Number(c.lessons)]));
  const latest = await db.query(
    `SELECT l.title, l.slug, l.summary, c.level FROM lessons l JOIN chapters c ON c.id = l.chapter_id
      WHERE l.published = 1 ORDER BY l.created_at DESC, l.id DESC LIMIT 6`
  );
  const stats = await db.one(
    `SELECT (SELECT COUNT(*) FROM lessons WHERE published = 1) AS lessons,
            (SELECT COUNT(*) FROM questions) AS questions`
  );
  res.render('home', {
    title: null,
    levelCards: LEVELS.map((l) => ({ ...l, lessonCount: countByLevel[l.slug] || 0 })),
    latest,
    stats,
    simulations: SIMULATIONS,
    featuredSimulations: FEATURED_SIMULATIONS,
  });
});

router.get('/cap/:level', async (req, res, next) => {
  const level = getLevel(req.params.level);
  if (!level) return next();
  const chapters = await getLevelTree(level.slug);

  let completed = new Set();
  if (req.user) {
    const rows = await db.query('SELECT lesson_id FROM lesson_progress WHERE user_id = ?', [req.user.id]);
    completed = new Set(rows.map((r) => r.lesson_id));
  }
  res.render('level', { title: level.name, level, chapters, completed });
});

router.get('/bai/:slug', async (req, res, next) => {
  const lesson = await getLessonBySlug(req.params.slug, { includeDrafts: res.locals.isStaff });
  if (!lesson) return next();
  await renderLesson(req, res, lesson);
});

async function renderLesson(req, res, lesson, quizResult = null) {
  const questions = await getQuestions(lesson.id);
  const neighbours = await getNeighbours(lesson);
  let completed = false;
  let bestAttempt = null;
  if (req.user) {
    completed = Boolean(
      await db.one('SELECT 1 AS done FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [req.user.id, lesson.id])
    );
    bestAttempt = await db.one(
      'SELECT score, total FROM quiz_attempts WHERE user_id = ? AND lesson_id = ? ORDER BY score / total DESC, id DESC LIMIT 1',
      [req.user.id, lesson.id]
    );
  }
  res.render('lesson', {
    title: lesson.title,
    lesson,
    level: getLevel(lesson.level),
    contentHtml: render(lesson.content_md),
    questions: questions.map((q) => ({
      ...q,
      promptHtml: render(q.prompt_md),
      optionsHtml: q.options.map((o) => render(String(o), { inline: true })),
      explanationHtml: render(q.explanation_md || ''),
    })),
    simulation: lesson.simulation ? getSimulation(lesson.simulation) : null,
    neighbours,
    completed,
    bestAttempt,
    quizResult,
  });
}

router.get('/mo-phong', (req, res) => {
  res.render('simulations', { title: 'Mô phỏng tương tác', groups: groupedSimulations(), total: SIMULATIONS.length });
});

router.get('/mo-phong/:key', async (req, res, next) => {
  const simulation = getSimulation(req.params.key);
  if (!simulation) return next();
  const related = await db.query(
    `SELECT l.title, l.slug FROM lessons l WHERE l.simulation = ? AND l.published = 1 ORDER BY l.id`,
    [simulation.key]
  );
  res.render('simulation', { title: simulation.title, simulation, related });
});

router.get('/tim-kiem', async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  let results = [];
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, '\\$&')}%`;
    results = await db.query(
      `SELECT l.title, l.slug, l.summary, c.level, c.title AS chapter_title
         FROM lessons l JOIN chapters c ON c.id = l.chapter_id
        WHERE l.published = 1 AND (l.title LIKE ? OR l.summary LIKE ? OR l.content_md LIKE ?)
        ORDER BY (l.title LIKE ?) DESC, l.title LIMIT 30`,
      [like, like, like, like]
    );
  }
  res.render('search', { title: 'Tìm kiếm', q, results });
});

module.exports = router;
module.exports.renderLesson = renderLesson;
