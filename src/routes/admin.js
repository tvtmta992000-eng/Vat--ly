const express = require('express');
const db = require('../db');
const { LEVELS, getLevel } = require('../levels');
const { SIMULATIONS } = require('../simulations');
const { requireRole } = require('../lib/middleware');
const { render } = require('../lib/markdown');
const { parseOptions } = require('../lib/quiz');
const { slugify } = require('../lib/content');

const router = express.Router();
const MAX_OPTIONS = 6;

router.use(requireRole('teacher', 'admin'));
router.use((req, res, next) => {
  res.locals.adminSection = req.path.split('/')[1] || 'tong-quan';
  next();
});

// ---------- Tổng quan ----------

router.get('/', async (req, res) => {
  const lessons = await db.query(
    `SELECT l.id, l.title, l.slug, l.published, l.updated_at, c.title AS chapter_title, c.level,
            (SELECT COUNT(*) FROM questions q WHERE q.lesson_id = l.id) AS question_count
       FROM lessons l JOIN chapters c ON c.id = l.chapter_id
      ORDER BY FIELD(c.level, ${LEVELS.map(() => '?').join(',')}), c.position, c.id, l.position, l.id`,
    LEVELS.map((l) => l.slug)
  );
  const stats = await db.one(
    `SELECT (SELECT COUNT(*) FROM chapters) AS chapters, (SELECT COUNT(*) FROM lessons) AS lessons,
            (SELECT COUNT(*) FROM questions) AS questions, (SELECT COUNT(*) FROM users) AS users`
  );
  res.render('admin/index', {
    title: 'Quản trị',
    stats,
    lessons: lessons.map((l) => ({ ...l, levelName: getLevel(l.level)?.name || l.level })),
  });
});

router.post('/xem-truoc', (req, res) => {
  res.json({ html: render(String(req.body.markdown || '').slice(0, 200000)) });
});

// ---------- Chương ----------

function readChapter(body) {
  return {
    level: getLevel(body.level) ? body.level : '',
    title: String(body.title || '').trim(),
    description: String(body.description || '').trim(),
    position: Number.parseInt(body.position, 10) || 0,
  };
}

function validateChapter(values) {
  const errors = {};
  if (!values.level) errors.level = 'Chọn cấp học.';
  if (!values.title) errors.title = 'Nhập tên chương.';
  return errors;
}

router.get('/chuong', async (req, res) => {
  const chapters = await db.query(
    `SELECT c.*, (SELECT COUNT(*) FROM lessons l WHERE l.chapter_id = c.id) AS lesson_count
       FROM chapters c ORDER BY FIELD(c.level, ${LEVELS.map(() => '?').join(',')}), c.position, c.id`,
    LEVELS.map((l) => l.slug)
  );
  res.render('admin/chapters', {
    title: 'Quản lý chương',
    chapters: chapters.map((c) => ({ ...c, levelName: getLevel(c.level)?.name || c.level })),
    values: { level: req.query.cap || '' },
    errors: {},
  });
});

router.post('/chuong', async (req, res) => {
  const values = readChapter(req.body);
  const errors = validateChapter(values);
  if (Object.keys(errors).length) {
    req.flash('error', Object.values(errors).join(' '));
    return res.redirect('/quan-tri/chuong');
  }
  await db.query('INSERT INTO chapters (level, title, description, position) VALUES (?, ?, ?, ?)', [
    values.level,
    values.title,
    values.description || null,
    values.position,
  ]);
  req.flash('success', `Đã tạo chương "${values.title}".`);
  res.redirect('/quan-tri/chuong');
});

router.get('/chuong/:id', async (req, res, next) => {
  const chapter = await db.one('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
  if (!chapter) return next();
  res.render('admin/chapter-form', { title: 'Sửa chương', chapter, values: chapter, errors: {} });
});

router.post('/chuong/:id', async (req, res, next) => {
  const chapter = await db.one('SELECT * FROM chapters WHERE id = ?', [req.params.id]);
  if (!chapter) return next();
  const values = readChapter(req.body);
  const errors = validateChapter(values);
  if (Object.keys(errors).length) {
    return res.status(400).render('admin/chapter-form', { title: 'Sửa chương', chapter, values, errors });
  }
  await db.query('UPDATE chapters SET level = ?, title = ?, description = ?, position = ? WHERE id = ?', [
    values.level,
    values.title,
    values.description || null,
    values.position,
    chapter.id,
  ]);
  req.flash('success', 'Đã lưu chương.');
  res.redirect('/quan-tri/chuong');
});

router.post('/chuong/:id/xoa', async (req, res) => {
  const { count } = await db.one('SELECT COUNT(*) AS count FROM lessons WHERE chapter_id = ?', [req.params.id]);
  if (count > 0) {
    req.flash('error', 'Chương vẫn còn bài học. Hãy chuyển hoặc xoá các bài học trước.');
  } else {
    await db.query('DELETE FROM chapters WHERE id = ?', [req.params.id]);
    req.flash('success', 'Đã xoá chương.');
  }
  res.redirect('/quan-tri/chuong');
});

// ---------- Bài học ----------

async function chapterOptions() {
  const chapters = await db.query(
    `SELECT id, level, title FROM chapters ORDER BY FIELD(level, ${LEVELS.map(() => '?').join(',')}), position, id`,
    LEVELS.map((l) => l.slug)
  );
  return LEVELS.map((l) => ({ ...l, chapters: chapters.filter((c) => c.level === l.slug) })).filter(
    (group) => group.chapters.length > 0
  );
}

function readLesson(body) {
  return {
    chapter_id: Number.parseInt(body.chapter_id, 10) || null,
    title: String(body.title || '').trim(),
    slug: slugify(body.slug || body.title || ''),
    summary: String(body.summary || '').trim().slice(0, 500),
    content_md: String(body.content_md || ''),
    simulation: SIMULATIONS.some((s) => s.key === body.simulation) ? body.simulation : null,
    position: Number.parseInt(body.position, 10) || 0,
    published: body.published === '1' ? 1 : 0,
  };
}

async function validateLesson(values, currentId = null) {
  const errors = {};
  if (!values.chapter_id || !(await db.one('SELECT id FROM chapters WHERE id = ?', [values.chapter_id]))) {
    errors.chapter_id = 'Chọn chương.';
  }
  if (!values.title) errors.title = 'Nhập tên bài học.';
  if (!values.slug) errors.slug = 'Đường dẫn không hợp lệ.';
  else if (await db.one('SELECT id FROM lessons WHERE slug = ? AND id <> ?', [values.slug, currentId || 0])) {
    errors.slug = 'Đường dẫn này đã được dùng cho bài khác.';
  }
  if (!values.content_md.trim()) errors.content_md = 'Nhập nội dung bài học.';
  return errors;
}

async function renderLessonForm(res, { lesson = null, values, errors = {}, status = 200 }) {
  const questions = lesson
    ? (await db.query('SELECT * FROM questions WHERE lesson_id = ? ORDER BY position, id', [lesson.id])).map((q) => ({
        ...q,
        options: parseOptions(q),
      }))
    : [];
  res.status(status).render('admin/lesson-form', {
    title: lesson ? `Sửa bài: ${lesson.title}` : 'Thêm bài học',
    lesson,
    values,
    errors,
    chapterGroups: await chapterOptions(),
    simulations: SIMULATIONS,
    questions,
  });
}

router.get('/bai/moi', async (req, res) => {
  await renderLessonForm(res, {
    values: { published: 1, chapter_id: Number(req.query.chuong) || null, content_md: '' },
  });
});

router.post('/bai', async (req, res) => {
  const values = readLesson(req.body);
  const errors = await validateLesson(values);
  if (Object.keys(errors).length) return renderLessonForm(res, { values, errors, status: 400 });
  const result = await db.query(
    `INSERT INTO lessons (chapter_id, title, slug, summary, content_md, simulation, position, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [values.chapter_id, values.title, values.slug, values.summary || null, values.content_md, values.simulation, values.position, values.published]
  );
  req.flash('success', 'Đã tạo bài học. Bạn có thể thêm câu hỏi trắc nghiệm bên dưới.');
  res.redirect(`/quan-tri/bai/${result.insertId}`);
});

router.get('/bai/:id', async (req, res, next) => {
  const lesson = await db.one('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
  if (!lesson) return next();
  await renderLessonForm(res, { lesson, values: lesson });
});

router.post('/bai/:id', async (req, res, next) => {
  const lesson = await db.one('SELECT * FROM lessons WHERE id = ?', [req.params.id]);
  if (!lesson) return next();
  const values = readLesson(req.body);
  const errors = await validateLesson(values, lesson.id);
  if (Object.keys(errors).length) return renderLessonForm(res, { lesson, values, errors, status: 400 });
  await db.query(
    `UPDATE lessons SET chapter_id = ?, title = ?, slug = ?, summary = ?, content_md = ?, simulation = ?,
            position = ?, published = ? WHERE id = ?`,
    [values.chapter_id, values.title, values.slug, values.summary || null, values.content_md, values.simulation, values.position, values.published, lesson.id]
  );
  req.flash('success', 'Đã lưu bài học.');
  res.redirect(`/quan-tri/bai/${lesson.id}`);
});

router.post('/bai/:id/xoa', async (req, res) => {
  await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
  req.flash('success', 'Đã xoá bài học và các câu hỏi kèm theo.');
  res.redirect('/quan-tri');
});

// ---------- Câu hỏi trắc nghiệm ----------

function readQuestion(body) {
  const rawOptions = [];
  for (let i = 0; i < MAX_OPTIONS; i += 1) rawOptions.push(String(body[`option_${i}`] || '').trim());
  const chosen = Number.parseInt(body.correct_index, 10);

  // Bỏ các lựa chọn trống và dịch lại chỉ số đáp án đúng cho khớp.
  const options = [];
  let correctIndex = -1;
  rawOptions.forEach((text, i) => {
    if (!text) return;
    if (i === chosen) correctIndex = options.length;
    options.push(text);
  });

  return {
    prompt_md: String(body.prompt_md || '').trim(),
    explanation_md: String(body.explanation_md || '').trim(),
    position: Number.parseInt(body.position, 10) || 0,
    options,
    rawOptions,
    correct_index: correctIndex,
    chosenRaw: Number.isNaN(chosen) ? null : chosen,
  };
}

function validateQuestion(values) {
  const errors = {};
  if (!values.prompt_md) errors.prompt_md = 'Nhập nội dung câu hỏi.';
  if (values.options.length < 2) errors.options = 'Cần ít nhất 2 lựa chọn.';
  else if (values.correct_index < 0) errors.options = 'Chọn đáp án đúng (lựa chọn đó không được để trống).';
  return errors;
}

function questionFormValues(question) {
  const options = parseOptions(question);
  return {
    ...question,
    rawOptions: Array.from({ length: MAX_OPTIONS }, (_, i) => options[i] || ''),
    chosenRaw: question.correct_index,
  };
}

async function renderQuestionForm(res, { lesson, question = null, values, errors = {}, status = 200 }) {
  res.status(status).render('admin/question-form', {
    title: question ? 'Sửa câu hỏi' : 'Thêm câu hỏi',
    lesson,
    question,
    values,
    errors,
    maxOptions: MAX_OPTIONS,
  });
}

router.get('/bai/:id/cau-hoi/moi', async (req, res, next) => {
  const lesson = await db.one('SELECT id, title FROM lessons WHERE id = ?', [req.params.id]);
  if (!lesson) return next();
  const { nextPos } = await db.one('SELECT COALESCE(MAX(position), -1) + 1 AS nextPos FROM questions WHERE lesson_id = ?', [lesson.id]);
  await renderQuestionForm(res, {
    lesson,
    values: { rawOptions: Array(MAX_OPTIONS).fill(''), chosenRaw: 0, position: nextPos },
  });
});

router.post('/bai/:id/cau-hoi', async (req, res, next) => {
  const lesson = await db.one('SELECT id, title FROM lessons WHERE id = ?', [req.params.id]);
  if (!lesson) return next();
  const values = readQuestion(req.body);
  const errors = validateQuestion(values);
  if (Object.keys(errors).length) return renderQuestionForm(res, { lesson, values, errors, status: 400 });
  await db.query(
    `INSERT INTO questions (lesson_id, prompt_md, options_json, correct_index, explanation_md, position)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [lesson.id, values.prompt_md, JSON.stringify(values.options), values.correct_index, values.explanation_md || null, values.position]
  );
  req.flash('success', 'Đã thêm câu hỏi.');
  res.redirect(req.body.another === '1' ? `/quan-tri/bai/${lesson.id}/cau-hoi/moi` : `/quan-tri/bai/${lesson.id}#cau-hoi`);
});

router.get('/cau-hoi/:id', async (req, res, next) => {
  const question = await db.one('SELECT * FROM questions WHERE id = ?', [req.params.id]);
  if (!question) return next();
  const lesson = await db.one('SELECT id, title FROM lessons WHERE id = ?', [question.lesson_id]);
  await renderQuestionForm(res, { lesson, question, values: questionFormValues(question) });
});

router.post('/cau-hoi/:id', async (req, res, next) => {
  const question = await db.one('SELECT * FROM questions WHERE id = ?', [req.params.id]);
  if (!question) return next();
  const lesson = await db.one('SELECT id, title FROM lessons WHERE id = ?', [question.lesson_id]);
  const values = readQuestion(req.body);
  const errors = validateQuestion(values);
  if (Object.keys(errors).length) return renderQuestionForm(res, { lesson, question, values, errors, status: 400 });
  await db.query(
    'UPDATE questions SET prompt_md = ?, options_json = ?, correct_index = ?, explanation_md = ?, position = ? WHERE id = ?',
    [values.prompt_md, JSON.stringify(values.options), values.correct_index, values.explanation_md || null, values.position, question.id]
  );
  req.flash('success', 'Đã lưu câu hỏi.');
  res.redirect(`/quan-tri/bai/${lesson.id}#cau-hoi`);
});

router.post('/cau-hoi/:id/xoa', async (req, res, next) => {
  const question = await db.one('SELECT lesson_id FROM questions WHERE id = ?', [req.params.id]);
  if (!question) return next();
  await db.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
  req.flash('success', 'Đã xoá câu hỏi.');
  res.redirect(`/quan-tri/bai/${question.lesson_id}#cau-hoi`);
});

// ---------- Người dùng (chỉ admin) ----------

const ROLES = { student: 'Học sinh', teacher: 'Giáo viên', admin: 'Quản trị viên' };

router.get('/nguoi-dung', requireRole('admin'), async (req, res) => {
  const users = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM lesson_progress p WHERE p.user_id = u.id) AS completed
       FROM users u ORDER BY u.created_at DESC LIMIT 500`
  );
  res.render('admin/users', { title: 'Người dùng', users, roles: ROLES });
});

router.post('/nguoi-dung/:id/vai-tro', requireRole('admin'), async (req, res) => {
  const role = req.body.role;
  if (!ROLES[role]) {
    req.flash('error', 'Vai trò không hợp lệ.');
  } else if (Number(req.params.id) === req.user.id) {
    req.flash('error', 'Bạn không thể tự đổi vai trò của chính mình.');
  } else {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    req.flash('success', 'Đã cập nhật vai trò.');
  }
  res.redirect('/quan-tri/nguoi-dung');
});

module.exports = router;
module.exports.readQuestion = readQuestion;
