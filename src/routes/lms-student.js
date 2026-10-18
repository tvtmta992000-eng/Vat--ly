// Hệ thống học tập — phần dành cho học viên (/hoc-tap): vào lớp, làm bài, xem kết quả, luyện tập, tiến bộ.
const express = require('express');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const lms = require('../lib/lms');
const { requireLogin } = require('../lib/middleware');
const { TOPICS, getTopic, DIFFICULTIES } = require('../lib/topics');
const { prepareExam, responseText, score } = require('../lib/lms-view');
const { lineChart } = require('../lib/charts');
const time = require('../lib/time');
const { toInt, action, notFound } = require('./lms-common');

const router = express.Router();
const LmsError = lms.LmsError;

router.use('/hoc-tap', requireLogin);
router.use('/hoc-tap', (req, res, next) => {
  Object.assign(res.locals, { time, score, getTopic, DIFFICULTIES, STATUS_LABELS: lms.STATUS_LABELS });
  next();
});

// Chống dò mã lớp
const joinLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-7', legacyHeaders: false });

router.get('/hoc-tap', async (req, res) => {
  const assignments = await lms.assignmentsForStudent(req.user.id);
  const classes = await db.query(
    `SELECT c.id, c.name, c.code, u.name AS teacher_name FROM class_members m JOIN classes c ON c.id = m.class_id
       JOIN users u ON u.id = c.teacher_id WHERE m.user_id = ? AND c.archived = 0 ORDER BY c.name`,
    [req.user.id]
  );
  const assigned = assignments.filter((a) => !a.is_auto_practice);
  const practice = assignments.filter((a) => a.is_auto_practice);
  res.render('lms/student/index', {
    title: 'Học tập',
    classes,
    todo: assigned.filter((a) => ['todo', 'doing', 'overdue'].includes(a.status)),
    upcoming: assigned.filter((a) => a.status === 'upcoming'),
    done: assigned.filter((a) => ['done', 'late'].includes(a.status)),
    practice,
    mastery: await lms.topicMastery(req.user.id),
  });
});

router.post('/hoc-tap/vao-lop', joinLimiter, action(async (req, res) => {
  const code = String(req.body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length !== 6) throw new LmsError('Mã lớp gồm 6 ký tự (chữ và số).');
  const cls = await db.one('SELECT * FROM classes WHERE code = ?', [code]);
  if (!cls) throw new LmsError('Mã lớp không đúng. Kiểm tra lại với giáo viên.');
  if (cls.archived) throw new LmsError('Lớp này đã kết thúc, không nhận thêm học viên.');
  if (cls.teacher_id === req.user.id) throw new LmsError('Bạn là giáo viên của lớp này.');
  const r = await db.query('INSERT IGNORE INTO class_members (class_id, user_id) VALUES (?, ?)', [cls.id, req.user.id]);
  req.flash('success', r.affectedRows ? `Đã vào lớp "${cls.name}".` : `Bạn đã ở trong lớp "${cls.name}".`);
  res.redirect('/hoc-tap');
}, '/hoc-tap'));

router.post('/hoc-tap/lop/:id/roi', async (req, res) => {
  await db.query('DELETE FROM class_members WHERE class_id = ? AND user_id = ?', [toInt(req.params.id), req.user.id]);
  req.flash('success', 'Đã rời lớp. Kết quả các bài đã làm vẫn được lưu.');
  res.redirect('/hoc-tap');
});

// ---------- Bài giao ----------

async function loadStudentAssignment(req, res) {
  const a = await lms.getAssignment(toInt(req.params.id));
  if (!a || !(await lms.isTarget(a, req.user.id))) {
    notFound(res, 'Không tìm thấy bài, hoặc bài này không được giao cho bạn.');
    return null;
  }
  return a;
}

router.get('/hoc-tap/bai/:id', async (req, res) => {
  const a = await loadStudentAssignment(req, res);
  if (!a) return;
  const attempts = await db.query('SELECT * FROM attempts WHERE assignment_id = ? AND user_id = ? ORDER BY id', [a.id, req.user.id]);
  const { n: questions } = await db.one('SELECT COUNT(*) AS n FROM exam_items WHERE exam_id = ?', [a.exam_id]);
  const { total } = await db.one('SELECT COALESCE(SUM(points), 0) AS total FROM exam_items WHERE exam_id = ?', [a.exam_id]);
  res.render('lms/student/assignment', {
    title: a.title,
    a,
    attempts,
    questions,
    total: Number(total),
    duration: a.duration_min || a.exam_duration,
    ...lms.summarizeAttempts(a, attempts),
  });
});

router.post('/hoc-tap/bai/:id/bat-dau', action(async (req, res) => {
  const a = await loadStudentAssignment(req, res);
  if (!a) return;
  const attemptId = await lms.startAttempt(a, req.user.id);
  res.redirect(`/hoc-tap/lam/${attemptId}`);
}, (req) => `/hoc-tap/bai/${req.params.id}`));

// ---------- Làm bài ----------

async function loadOwnAttempt(req, res) {
  const attempt = await db.one('SELECT * FROM attempts WHERE id = ? AND user_id = ?', [toInt(req.params.id), req.user.id]);
  if (!attempt) {
    notFound(res, 'Không tìm thấy bài làm.');
    return null;
  }
  const a = await lms.getAssignment(attempt.assignment_id);
  return { attempt, a };
}

// Đọc câu trả lời từ form (a_<id>, a_<id>_<k>) hoặc từ JSON { answers }
function readAnswers(body) {
  if (body && body.answers && typeof body.answers === 'object') return body.answers;
  const answers = {};
  for (const [key, value] of Object.entries(body || {})) {
    let m = key.match(/^a_(\d+)$/);
    if (m) {
      answers[m[1]] = value;
      continue;
    }
    m = key.match(/^a_(\d+)_([0-3])$/);
    if (m) {
      if (!Array.isArray(answers[m[1]])) answers[m[1]] = [null, null, null, null];
      answers[m[1]][Number(m[2])] = value;
    }
  }
  return answers;
}

router.get('/hoc-tap/lam/:id', async (req, res) => {
  const loaded = await loadOwnAttempt(req, res);
  if (!loaded) return;
  const { attempt, a } = loaded;
  if (attempt.status === 'submitted') return res.redirect(`/hoc-tap/ket-qua/${attempt.id}`);
  const items = await lms.getExamItems(a.exam_id);
  res.render('lms/student/take', {
    title: a.title,
    a,
    attempt,
    parts: prepareExam(items),
    answers: JSON.parse(attempt.answers_json || '{}'),
    count: items.length,
    total: items.reduce((s, it) => s + it.points, 0),
    deadlineMs: attempt.deadline_at ? new Date(attempt.deadline_at).getTime() : null,
    dueMs: a.due_at ? new Date(a.due_at).getTime() : null,
  });
});

router.post('/hoc-tap/lam/:id/luu', async (req, res) => {
  const loaded = await loadOwnAttempt(req, res);
  if (!loaded) return;
  const { attempt, a } = loaded;
  if (attempt.status !== 'in_progress') return res.status(409).json({ ok: false, error: 'Bài đã nộp.' });
  const items = await lms.getExamItems(a.exam_id);
  const answers = await lms.saveAnswers(attempt, items, readAnswers(req.body));
  res.json({ ok: true, saved: Object.keys(answers).length, at: Date.now() });
});

router.post('/hoc-tap/lam/:id/nop', async (req, res) => {
  const loaded = await loadOwnAttempt(req, res);
  if (!loaded) return;
  const { attempt, a } = loaded;
  if (attempt.status === 'submitted') return res.redirect(`/hoc-tap/ket-qua/${attempt.id}`);
  const items = await lms.getExamItems(a.exam_id);
  const result = await lms.submitAttempt(attempt, a, items, readAnswers(req.body));
  if (!result.alreadySubmitted) {
    const an = result.analysis;
    let msg = `Đã nộp bài: ${score(an.score)}/${score(an.maxScore)} điểm.`;
    if (an.autoPractice) msg += ' Hệ thống đã tạo bài luyện tập theo điểm yếu của bạn.';
    req.flash('success', msg);
  }
  res.redirect(`/hoc-tap/ket-qua/${attempt.id}`);
});

// ---------- Kết quả ----------

function answersVisible(a) {
  if (a.show_answers === 'never') return false;
  if (a.show_answers === 'after_due' && a.due_at && new Date(a.due_at) > new Date()) return false;
  return true;
}

router.get('/hoc-tap/ket-qua/:id', async (req, res) => {
  const loaded = await loadOwnAttempt(req, res);
  if (!loaded) return;
  const { attempt, a } = loaded;
  if (attempt.status !== 'submitted') return res.redirect(`/hoc-tap/lam/${attempt.id}`);
  const items = await lms.getExamItems(a.exam_id);
  const rows = await db.query('SELECT * FROM attempt_items WHERE attempt_id = ?', [attempt.id]);
  const byItem = Object.fromEntries(rows.map((r) => [r.exam_item_id, r]));
  for (const item of items) {
    const r = byItem[item.id];
    const response = r && r.response_json ? JSON.parse(r.response_json) : null;
    const points = r ? (r.override_points !== null ? Number(r.override_points) : Number(r.auto_points)) : 0;
    item.result = { response, points, max: item.points, correctParts: r ? r.correct_parts : 0, adjusted: r && r.override_points !== null };
    item.responseText = responseText(item, response);
  }
  const analysis = JSON.parse(attempt.analysis_json || '{}');
  // Bài học gợi ý còn tồn tại trên website
  const slugs = (analysis.review || []).flatMap((r) => r.lessons);
  const lessons = slugs.length ? await db.query('SELECT slug, title FROM lessons WHERE slug IN (?) AND published = 1', [slugs]) : [];
  const { SIMULATIONS } = require('../simulations');
  const attempts = await db.query("SELECT id, score, max_score, submitted_at FROM attempts WHERE assignment_id = ? AND user_id = ? AND status = 'submitted' ORDER BY id", [a.id, req.user.id]);
  const summary = lms.summarizeAttempts(a, await db.query('SELECT * FROM attempts WHERE assignment_id = ? AND user_id = ? ORDER BY id', [a.id, req.user.id]));
  res.render('lms/student/result', {
    title: `Kết quả: ${a.title}`,
    a,
    attempt,
    analysis,
    parts: prepareExam(items),
    showAnswers: answersVisible(a),
    lessonsBySlug: Object.fromEntries(lessons.map((l) => [l.slug, l])),
    simulations: Object.fromEntries(SIMULATIONS.map((s) => [s.key, s])),
    attempts,
    canRetry: summary.attemptsLeft > 0,
  });
});

router.post('/hoc-tap/ket-qua/:id/luyen-tap', action(async (req, res) => {
  const loaded = await loadOwnAttempt(req, res);
  if (!loaded) return;
  const analysis = JSON.parse(loaded.attempt.analysis_json || '{}');
  let plan = analysis.practicePlan || [];
  if (!plan.length) {
    // Làm tốt hết: luyện mức vận dụng ở các chủ đề vừa làm
    plan = (analysis.byTopic || []).map((t) => ({ topic: t.key, difficulty: 3 }));
  }
  const practice = await lms.createPractice(req.user.id, plan, { sourceAttemptId: loaded.attempt.id, createdBy: req.user.id });
  if (!practice) throw new LmsError('Ngân hàng chưa đủ câu hỏi cho các chủ đề này để tạo bài luyện tập.');
  req.flash('success', `Đã tạo "${practice.title}" (${practice.questions} câu).`);
  res.redirect(`/hoc-tap/bai/${practice.assignmentId}`);
}, (req) => `/hoc-tap/ket-qua/${req.params.id}`));

// ---------- Tự luyện tập theo chủ đề ----------

router.get('/hoc-tap/luyen-tap', async (req, res) => {
  const mastery = await lms.topicMastery(req.user.id);
  const counts = await db.query('SELECT topic, COUNT(*) AS n FROM bank_questions GROUP BY topic');
  const countBy = Object.fromEntries(counts.map((c) => [c.topic, c.n]));
  res.render('lms/student/practice', {
    title: 'Tự luyện tập',
    topics: TOPICS.map((t) => ({ ...t, count: countBy[t.key] || 0, mastery: mastery.find((m) => m.key === t.key) || null })),
    suggested: mastery.filter((m) => m.pct < 80).slice(0, 3),
  });
});

router.post('/hoc-tap/luyen-tap', action(async (req, res) => {
  const topics = [...new Set([].concat(req.body.topics || []))].filter((t) => getTopic(t).lessons.length).slice(0, 3);
  if (!topics.length) throw new LmsError('Chọn từ 1 đến 3 chủ đề.');
  const mastery = await lms.topicMastery(req.user.id);
  let plan = lms.planFromMastery(mastery, topics);
  const level = toInt(req.body.difficulty);
  if (DIFFICULTIES[level]) plan = plan.map((p) => ({ ...p, difficulty: level }));
  const perTopic = Math.min(10, Math.max(3, toInt(req.body.per_topic) || 5));
  const practice = await lms.createPractice(req.user.id, plan, { createdBy: req.user.id, perTopic });
  if (!practice) throw new LmsError('Ngân hàng chưa đủ câu hỏi cho chủ đề đã chọn.');
  req.flash('success', `Đã tạo "${practice.title}" (${practice.questions} câu).`);
  res.redirect(`/hoc-tap/bai/${practice.assignmentId}`);
}, '/hoc-tap/luyen-tap'));

// ---------- Tiến bộ ----------

router.get('/hoc-tap/tien-bo', async (req, res) => {
  const attempts = await db.query(
    `SELECT t.id, t.score, t.max_score, t.submitted_at, t.is_late, t.analysis_json, a.title, a.is_auto_practice
       FROM attempts t JOIN assignments a ON a.id = t.assignment_id
      WHERE t.user_id = ? AND t.status = 'submitted' ORDER BY t.submitted_at`,
    [req.user.id]
  );
  const { ERROR_LABELS } = require('../lib/analysis');
  const errorTotals = {};
  attempts.forEach((t) => (JSON.parse(t.analysis_json || '{}').errorSummary || []).forEach((e) => { errorTotals[e.kind] = (errorTotals[e.kind] || 0) + e.count; }));
  const assigned = attempts.filter((t) => !t.is_auto_practice);
  res.render('lms/student/progress', {
    title: 'Tiến bộ của tôi',
    attempts: attempts.slice().reverse(),
    mastery: await lms.topicMastery(req.user.id, 100),
    errorTotals: Object.entries(errorTotals).map(([kind, count]) => ({ kind, label: ERROR_LABELS[kind], count })).sort((x, y) => y.count - x.count),
    chart: lineChart(assigned.map((t) => ({ label: time.formatDate(t.submitted_at).slice(0, 5), value: (t.score / t.max_score) * 10, title: t.title })), { label: 'Điểm bài giao (thang 10)' }),
    practiceChart: lineChart(attempts.filter((t) => t.is_auto_practice).map((t) => ({ label: time.formatDate(t.submitted_at).slice(0, 5), value: (t.score / t.max_score) * 10, title: t.title })), { label: 'Điểm luyện tập (thang 10)' }),
  });
});

module.exports = router;
