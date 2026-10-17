const express = require('express');
const db = require('../db');
const { getLevel, LEVELS } = require('../levels');
const { requireLogin } = require('../lib/middleware');
const { getLessonBySlug, getQuestions } = require('../lib/content');
const { gradeQuiz } = require('../lib/quiz');
const { renderLesson } = require('./public');

const router = express.Router();

router.post('/bai/:slug/nop-bai', async (req, res, next) => {
  const lesson = await getLessonBySlug(req.params.slug, { includeDrafts: res.locals.isStaff });
  if (!lesson) return next();
  const questions = await getQuestions(lesson.id);
  if (questions.length === 0) return res.redirect(`/bai/${lesson.slug}`);

  const result = gradeQuiz(questions, req.body);
  if (req.user) {
    await db.query('INSERT INTO quiz_attempts (user_id, lesson_id, score, total) VALUES (?, ?, ?, ?)', [
      req.user.id,
      lesson.id,
      result.score,
      result.total,
    ]);
    // Đạt từ 80% trở lên thì tự đánh dấu hoàn thành bài học.
    if (result.score / result.total >= 0.8) {
      await db.query('INSERT IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)', [req.user.id, lesson.id]);
    }
  }
  await renderLesson(req, res, lesson, result);
});

router.post('/bai/:slug/hoan-thanh', requireLogin, async (req, res, next) => {
  const lesson = await getLessonBySlug(req.params.slug);
  if (!lesson) return next();
  if (req.body.undo === '1') {
    await db.query('DELETE FROM lesson_progress WHERE user_id = ? AND lesson_id = ?', [req.user.id, lesson.id]);
  } else {
    await db.query('INSERT IGNORE INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)', [req.user.id, lesson.id]);
    req.flash('success', `Đã đánh dấu hoàn thành bài "${lesson.title}".`);
  }
  res.redirect(`/bai/${lesson.slug}`);
});

router.get('/tien-do', requireLogin, async (req, res) => {
  const perLevel = await db.query(
    `SELECT c.level, COUNT(l.id) AS total, COUNT(p.lesson_id) AS done
       FROM lessons l
       JOIN chapters c ON c.id = l.chapter_id
       LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = ?
      WHERE l.published = 1
      GROUP BY c.level`,
    [req.user.id]
  );
  const byLevel = Object.fromEntries(perLevel.map((r) => [r.level, { total: Number(r.total), done: Number(r.done) }]));
  const levelProgress = LEVELS.map((l) => ({ ...l, ...(byLevel[l.slug] || { total: 0, done: 0 }) }));

  const attempts = await db.query(
    `SELECT a.score, a.total, a.created_at, l.title, l.slug
       FROM quiz_attempts a JOIN lessons l ON l.id = a.lesson_id
      WHERE a.user_id = ? ORDER BY a.created_at DESC, a.id DESC LIMIT 15`,
    [req.user.id]
  );
  const summary = await db.one(
    `SELECT COUNT(*) AS attempts, COALESCE(SUM(score), 0) AS correct, COALESCE(SUM(total), 0) AS answered
       FROM quiz_attempts WHERE user_id = ?`,
    [req.user.id]
  );
  const recentDone = await db.query(
    `SELECT l.title, l.slug, c.level, p.completed_at
       FROM lesson_progress p JOIN lessons l ON l.id = p.lesson_id JOIN chapters c ON c.id = l.chapter_id
      WHERE p.user_id = ? ORDER BY p.completed_at DESC LIMIT 8`,
    [req.user.id]
  );

  res.render('progress', {
    title: 'Tiến độ học tập',
    levelProgress,
    attempts,
    summary,
    recentDone: recentDone.map((r) => ({ ...r, levelName: getLevel(r.level)?.name })),
  });
});

module.exports = router;
