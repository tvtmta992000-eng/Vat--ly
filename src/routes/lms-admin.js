// Hệ thống quản trị học tập — phần dành cho giáo viên và quản trị viên (gắn dưới /quan-tri).
const express = require('express');
const multer = require('multer');
const db = require('../db');
const lms = require('../lib/lms');
const bankLib = require('../lib/bank');
const generator = require('../lib/generator');
const { requireRole } = require('../lib/middleware');
const { TOPICS, DIFFICULTIES, TYPES, getTopic } = require('../lib/topics');
const { readQuestionForm, formValues } = require('../lib/question-form');
const { extractText, parseExamText, ParseError } = require('../lib/exam-parser');
const { prepareExam, responseText, score, sendCsv } = require('../lib/lms-view');
const { itemStatistics, mergeTopicStats, ERROR_LABELS } = require('../lib/analysis');
const { gradeItem } = require('../lib/grading');
const { histogram, lineChart } = require('../lib/charts');
const time = require('../lib/time');
const { toInt, action, notFound, forbidden } = require('./lms-common');

const router = express.Router();
const LmsError = lms.LmsError;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1 },
});

router.use(requireRole('teacher', 'admin'));
router.use((req, res, next) => {
  Object.assign(res.locals, { TOPICS, DIFFICULTIES, TYPES, getTopic, time, score });
  next();
});

const KINDS = { practice: 'Luyện tập', test: 'Kiểm tra', exam: 'Đề thi' };
const SHOW_ANSWERS = { after_submit: 'Ngay sau khi nộp', after_due: 'Sau hạn nộp', never: 'Không hiện đáp án' };

// ===========================================================================
// LỚP HỌC
// ===========================================================================

async function loadClass(req, res) {
  const cls = await db.one('SELECT * FROM classes WHERE id = ?', [toInt(req.params.id)]);
  if (!cls || !lms.canManageClass(req.user, cls)) {
    notFound(res);
    return null;
  }
  return cls;
}

router.get('/lop', async (req, res) => {
  res.render('lms/admin/classes', { title: 'Lớp học', classes: await lms.classesFor(req.user) });
});

router.post('/lop', action(async (req, res) => {
  const name = String(req.body.name || '').trim().slice(0, 150);
  if (!name) throw new LmsError('Nhập tên lớp.');
  const code = await lms.newClassCode();
  const result = await db.query('INSERT INTO classes (name, code, description, teacher_id) VALUES (?, ?, ?, ?)', [
    name, code, String(req.body.description || '').trim().slice(0, 500) || null, req.user.id,
  ]);
  req.flash('success', `Đã tạo lớp "${name}" — mã lớp: ${code}. Gửi mã này cho học viên để vào lớp.`);
  res.redirect(`/quan-tri/lop/${result.insertId}`);
}, '/quan-tri/lop'));

router.get('/lop/:id', async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  const members = await db.query(
    `SELECT u.id, u.name, u.email, m.joined_at,
            (SELECT COUNT(*) FROM attempts t WHERE t.user_id = u.id AND t.status = 'submitted') AS attempts
       FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? ORDER BY u.name`,
    [cls.id]
  );
  const assignments = await db.query(
    `SELECT a.*, (SELECT COUNT(DISTINCT t.user_id) FROM attempts t WHERE t.assignment_id = a.id AND t.status = 'submitted') AS submitted
       FROM assignments a WHERE a.class_id = ? ORDER BY a.created_at DESC`,
    [cls.id]
  );
  const teacher = await db.one('SELECT name FROM users WHERE id = ?', [cls.teacher_id]);
  res.render('lms/admin/class-detail', { title: cls.name, cls, members, assignments, teacher });
});

router.post('/lop/:id', action(async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  const name = String(req.body.name || '').trim().slice(0, 150);
  if (!name) throw new LmsError('Nhập tên lớp.');
  await db.query('UPDATE classes SET name = ?, description = ?, archived = ? WHERE id = ?', [
    name, String(req.body.description || '').trim().slice(0, 500) || null, req.body.archived === '1' ? 1 : 0, cls.id,
  ]);
  req.flash('success', 'Đã lưu thông tin lớp.');
  res.redirect(`/quan-tri/lop/${cls.id}`);
}));

router.post('/lop/:id/ma-moi', async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  const code = await lms.newClassCode();
  await db.query('UPDATE classes SET code = ? WHERE id = ?', [code, cls.id]);
  req.flash('success', `Mã lớp mới: ${code}. Mã cũ không còn dùng được.`);
  res.redirect(`/quan-tri/lop/${cls.id}`);
});

// Thêm học viên theo email (nhiều email cách nhau bởi dấu phẩy hoặc xuống dòng)
router.post('/lop/:id/thanh-vien', action(async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  const emails = [...new Set(String(req.body.emails || '').toLowerCase().split(/[\s,;]+/).filter(Boolean))].slice(0, 200);
  if (!emails.length) throw new LmsError('Nhập email của học viên.');
  const users = await db.query('SELECT id, email FROM users WHERE email IN (?)', [emails]);
  for (const u of users) await db.query('INSERT IGNORE INTO class_members (class_id, user_id) VALUES (?, ?)', [cls.id, u.id]);
  const missing = emails.filter((e) => !users.some((u) => u.email === e));
  let msg = `Đã thêm ${users.length} học viên.`;
  if (missing.length) msg += ` Không tìm thấy tài khoản: ${missing.join(', ')} (học viên cần đăng ký trước, hoặc tự vào lớp bằng mã ${cls.code}).`;
  req.flash(users.length ? 'success' : 'error', msg);
  res.redirect(`/quan-tri/lop/${cls.id}#thanh-vien`);
}));

router.post('/lop/:id/thanh-vien/:uid/xoa', async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  await db.query('DELETE FROM class_members WHERE class_id = ? AND user_id = ?', [cls.id, toInt(req.params.uid)]);
  req.flash('success', 'Đã xoá học viên khỏi lớp (kết quả làm bài vẫn được giữ).');
  res.redirect(`/quan-tri/lop/${cls.id}#thanh-vien`);
});

router.post('/lop/:id/xoa', action(async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  const { n } = await db.one('SELECT COUNT(*) AS n FROM assignments WHERE class_id = ?', [cls.id]);
  if (n > 0) throw new LmsError('Lớp đã có bài giao nên không thể xoá (sẽ mất kết quả của học viên). Hãy chọn "Lưu trữ lớp" thay vì xoá.');
  await db.query('DELETE FROM classes WHERE id = ?', [cls.id]);
  req.flash('success', `Đã xoá lớp "${cls.name}".`);
  res.redirect('/quan-tri/lop');
}));

// Báo cáo lớp: bảng điểm học viên × bài giao, mức độ thành thạo theo chủ đề, học viên cần quan tâm
router.get('/lop/:id/bao-cao', async (req, res) => {
  const cls = await loadClass(req, res);
  if (!cls) return;
  const report = await classReport(cls);
  if (req.query.csv === '1') {
    const header = ['Học viên', 'Email', ...report.assignments.map((a) => a.title), 'Điểm TB (thang 10)'];
    const rows = report.students.map((s) => [s.name, s.email, ...report.assignments.map((a) => s.scores[a.id] ?? ''), s.avg ?? '']);
    return sendCsv(res, `bao-cao-lop-${cls.code}`, [header, ...rows]);
  }
  res.render('lms/admin/class-report', { title: `Báo cáo lớp ${cls.name}`, cls, ...report });
});

async function classReport(cls) {
  const assignments = await db.query('SELECT * FROM assignments WHERE class_id = ? ORDER BY COALESCE(due_at, created_at)', [cls.id]);
  const members = await db.query(
    'SELECT u.id, u.name, u.email FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? ORDER BY u.name',
    [cls.id]
  );
  const attempts = assignments.length
    ? await db.query(
      "SELECT id, assignment_id, user_id, score, max_score, is_late, status, analysis_json, submitted_at FROM attempts WHERE assignment_id IN (?) AND status = 'submitted' ORDER BY id",
      [assignments.map((a) => a.id)]
    )
    : [];
  const students = members.map((m) => {
    const scores = {};
    const analyses = [];
    for (const a of assignments) {
      const mine = attempts.filter((t) => t.assignment_id === a.id && t.user_id === m.id);
      const s = lms.summarizeAttempts(a, mine);
      if (s.counted) {
        scores[a.id] = s.score10;
        analyses.push(JSON.parse(s.counted.analysis_json || '{}'));
      }
    }
    const values = Object.values(scores);
    const avg = values.length ? Math.round((values.reduce((x, y) => x + y, 0) / values.length) * 100) / 100 : null;
    const done = values.length;
    return { ...m, scores, avg, done, mastery: mergeTopicStats(analyses) };
  });
  const assignmentStats = assignments.map((a) => {
    const vals = students.map((s) => s.scores[a.id]).filter((v) => v !== undefined);
    return { ...a, submitted: vals.length, avg: vals.length ? Math.round((vals.reduce((x, y) => x + y, 0) / vals.length) * 100) / 100 : null };
  });
  const mastery = mergeTopicStats(attempts.map((t) => JSON.parse(t.analysis_json || '{}')));
  const attention = students.filter((s) => (s.avg !== null && s.avg < 5) || (assignments.length && s.done < assignments.length / 2));
  const trend = assignmentStats.filter((a) => a.avg !== null).map((a) => ({ label: time.formatDate(a.due_at || a.created_at).slice(0, 5), value: a.avg, title: a.title }));
  return {
    assignments: assignmentStats,
    students,
    mastery,
    attention,
    trendChart: lineChart(trend, { label: 'Điểm trung bình của lớp qua các bài' }),
    histogramChart: histogram(students.filter((s) => s.avg !== null).map((s) => s.avg), { label: 'Phổ điểm trung bình của học viên' }),
  };
}

// ===========================================================================
// NGÂN HÀNG CÂU HỎI
// ===========================================================================

const PAGE_SIZE = 30;

router.get('/ngan-hang', async (req, res) => {
  const filters = {
    type: TYPES[req.query.dang] ? req.query.dang : '',
    grade: ['10', '11', '12'].includes(req.query.lop) ? Number(req.query.lop) : '',
    topic: getTopic(req.query.chu_de || '').lessons.length ? req.query.chu_de : '',
    difficulty: DIFFICULTIES[req.query.muc] ? Number(req.query.muc) : '',
    q: String(req.query.q || '').trim().slice(0, 100),
    examId: toInt(req.query.them_vao),
  };
  const where = ['1=1'];
  const params = [];
  if (filters.type) { where.push('type = ?'); params.push(filters.type); }
  if (filters.grade) { where.push('grade = ?'); params.push(filters.grade); }
  if (filters.topic) { where.push('topic = ?'); params.push(filters.topic); }
  if (filters.difficulty) { where.push('difficulty = ?'); params.push(filters.difficulty); }
  if (filters.q) { where.push('(stem_md LIKE ? OR context_md LIKE ? OR source LIKE ?)'); params.push(`%${filters.q}%`, `%${filters.q}%`, `%${filters.q}%`); }
  const page = Math.max(1, toInt(req.query.trang) || 1);
  const { total } = await db.one(`SELECT COUNT(*) AS total FROM bank_questions WHERE ${where.join(' AND ')}`, params);
  const rows = await db.query(
    `SELECT * FROM bank_questions WHERE ${where.join(' AND ')} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, PAGE_SIZE, (page - 1) * PAGE_SIZE]
  );
  const matrix = await db.query('SELECT topic, type, difficulty, COUNT(*) AS n FROM bank_questions GROUP BY topic, type, difficulty');
  let targetExam = null;
  if (filters.examId) {
    targetExam = await db.one('SELECT * FROM exams WHERE id = ?', [filters.examId]);
    if (!lms.canManageExam(req.user, targetExam)) targetExam = null;
  }
  res.render('lms/admin/bank', {
    title: 'Ngân hàng câu hỏi',
    questions: rows.map(bankLib.fromRow),
    filters,
    total,
    page,
    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    matrix,
    targetExam,
    query: req.query,
  });
});

function renderQuestionForm(res, { title, values, errors = [], action: formAction, question = null, history = [], back, preview = null, extra = {} }) {
  res.render('lms/admin/question-form', { title, values, errors, formAction, question, history, back, preview, ...extra });
}

function previewOf(question) {
  try {
    const concrete = bankLib.instantiate(question, { useDefault: true });
    const [part] = prepareExam([{ ...concrete, id: 0, part: 1, points: 1, position: 1 }]);
    return part.items[0];
  } catch {
    return null;
  }
}

router.get('/ngan-hang/moi', (req, res) => {
  const type = TYPES[req.query.dang] ? req.query.dang : 'mcq';
  renderQuestionForm(res, {
    title: 'Thêm câu hỏi',
    values: formValues({ type, topic: req.query.chu_de || 'vl12-c1', difficulty: 1, data: {} }),
    action: '/quan-tri/ngan-hang',
    back: '/quan-tri/ngan-hang',
  });
});

router.post('/ngan-hang', async (req, res) => {
  const { input, errors } = readQuestionForm(req.body);
  const { question, errors: more } = bankLib.normalizeQuestion(input);
  const all = [...errors, ...more];
  if (all.length) {
    return renderQuestionForm(res, { title: 'Thêm câu hỏi', values: formValues(question), errors: all, action: '/quan-tri/ngan-hang', back: '/quan-tri/ngan-hang' });
  }
  const id = await lms.saveBankQuestion(question, { userId: req.user.id });
  req.flash('success', 'Đã thêm câu hỏi vào ngân hàng.');
  res.redirect(req.body.another === '1' ? `/quan-tri/ngan-hang/moi?dang=${question.type}&chu_de=${question.topic}` : `/quan-tri/ngan-hang/${id}`);
});

router.get('/ngan-hang/:id', async (req, res) => {
  const q = await lms.getBankQuestion(toInt(req.params.id));
  if (!q) return notFound(res);
  const usage = await db.one('SELECT COUNT(*) AS n FROM exam_items WHERE bank_question_id = ?', [q.id]);
  renderQuestionForm(res, {
    title: 'Sửa câu hỏi',
    values: formValues(q),
    action: `/quan-tri/ngan-hang/${q.id}`,
    question: { ...q, usage: usage.n },
    history: await lms.editHistory('bank', q.id),
    back: '/quan-tri/ngan-hang',
    preview: previewOf(q),
  });
});

router.post('/ngan-hang/:id', async (req, res) => {
  const existing = await lms.getBankQuestion(toInt(req.params.id));
  if (!existing) return notFound(res);
  const { input, errors } = readQuestionForm(req.body);
  const { question, errors: more } = bankLib.normalizeQuestion(input);
  const all = [...errors, ...more];
  if (all.length) {
    return renderQuestionForm(res, {
      title: 'Sửa câu hỏi', values: formValues(question), errors: all, action: `/quan-tri/ngan-hang/${existing.id}`,
      question: existing, history: await lms.editHistory('bank', existing.id), back: '/quan-tri/ngan-hang',
    });
  }
  await lms.saveBankQuestion(question, { id: existing.id, userId: req.user.id });
  req.flash('success', 'Đã lưu câu hỏi. Các đề đã tạo trước đó giữ nguyên nội dung cũ.');
  res.redirect(`/quan-tri/ngan-hang/${existing.id}`);
});

router.post('/ngan-hang/:id/xoa', async (req, res) => {
  const q = await lms.getBankQuestion(toInt(req.params.id));
  if (!q) return notFound(res);
  await db.query('DELETE FROM bank_questions WHERE id = ?', [q.id]);
  await lms.logEdit('bank', q.id, 'delete', { sourceKey: q.sourceKey, stem: q.stem.slice(0, 200) }, req.user.id);
  req.flash('success', 'Đã xoá câu hỏi khỏi ngân hàng (các đề đã tạo không bị ảnh hưởng).');
  res.redirect('/quan-tri/ngan-hang');
});

router.post('/ngan-hang/tu-bai-hoc', async (req, res) => {
  const added = await lms.importLessonQuestions();
  req.flash('success', added ? `Đã chép ${added} câu trắc nghiệm từ bài học vào ngân hàng.` : 'Không có câu mới để chép.');
  res.redirect('/quan-tri/ngan-hang');
});

// ===========================================================================
// ĐỀ MẪU: tải lên → phân tích → duyệt → lưu ngân hàng / khung đề / sinh đề
// ===========================================================================

router.get('/de-mau', async (req, res) => {
  const uploads = await db.query(
    `SELECT s.id, s.filename, s.created_at, s.analysis_json, u.name AS user_name FROM sample_uploads s
       LEFT JOIN users u ON u.id = s.uploaded_by ORDER BY s.id DESC LIMIT 30`
  );
  res.render('lms/admin/samples', {
    title: 'Đề mẫu',
    uploads: uploads.map((u) => {
      const a = u.analysis_json ? JSON.parse(u.analysis_json) : null;
      return { ...u, count: a?.questions?.length || 0, saved: a?.saved || null };
    }),
  });
});

router.post('/de-mau', (req, res, next) => {
  upload.single('file')(req, res, async (err) => {
    try {
      if (err) {
        throw new ParseError(err.code === 'LIMIT_FILE_SIZE' ? 'File quá lớn (tối đa 15 MB).' : 'Không tải được file lên.');
      }
      let text;
      let filename;
      if (req.file) {
        filename = Buffer.from(req.file.originalname, 'latin1').toString('utf8').slice(0, 255);
        text = await extractText(req.file.buffer, filename);
      } else if (String(req.body.text || '').trim()) {
        filename = 'Văn bản dán trực tiếp';
        text = String(req.body.text);
      } else {
        throw new ParseError('Chọn file đề (.docx, .pdf, .txt) hoặc dán nội dung đề.');
      }
      const analysis = parseExamText(text);
      const result = await db.query('INSERT INTO sample_uploads (filename, extracted_text, analysis_json, uploaded_by) VALUES (?, ?, ?, ?)', [
        filename, text.slice(0, 1000000), JSON.stringify(analysis), req.user.id,
      ]);
      req.flash('success', `Đã đọc ${analysis.questions.length} câu hỏi từ "${filename}". Kiểm tra và chỉnh sửa trước khi lưu.`);
      res.redirect(`/quan-tri/de-mau/${result.insertId}`);
    } catch (e) {
      if (e instanceof ParseError) {
        req.flash('error', e.message);
        return res.redirect('/quan-tri/de-mau');
      }
      next(e);
    }
  });
});

async function loadUpload(req, res) {
  const row = await db.one('SELECT * FROM sample_uploads WHERE id = ?', [toInt(req.params.id)]);
  if (!row) {
    notFound(res);
    return null;
  }
  return { ...row, analysis: JSON.parse(row.analysis_json) };
}

router.get('/de-mau/:id', async (req, res) => {
  const up = await loadUpload(req, res);
  if (!up) return;
  const a = up.analysis;
  const structure = generator.structureFromItems(a.questions.map((q) => ({ ...q, points: generator.DEFAULT_POINTS[q.type] })));
  res.render('lms/admin/sample-review', {
    title: 'Duyệt đề mẫu',
    up,
    analysis: a,
    questions: a.questions.map((q) => ({ ...q, values: formValues(toBankInput(q)) })),
    structure,
    summary: generator.summarize(structure),
    errors: [],
  });
});

// Câu phân tích được → đầu vào ngân hàng
function toBankInput(q) {
  return {
    type: q.type,
    topic: q.topic,
    grade: getTopic(q.topic).grade,
    difficulty: q.difficulty,
    context: q.context,
    stem: q.stem,
    data: q.type === 'mcq' ? { options: q.options, answer: q.answer } : q.type === 'tf' ? { statements: q.statements, answers: q.answers || [null, null, null, null] } : { answer: q.answer, decimals: q.decimals, unit: '' },
    explanation: q.explanation || null,
  };
}

router.post('/de-mau/:id', action(async (req, res) => {
  const up = await loadUpload(req, res);
  if (!up) return;
  const a = up.analysis;
  const count = a.questions.length;
  const accepted = [];
  const problems = [];
  for (let i = 0; i < count; i += 1) {
    if (req.body[`q${i}_keep`] !== '1') continue;
    const { input, errors } = readQuestionForm(req.body, `q${i}_`);
    input.source = up.filename;
    const { question, errors: more } = bankLib.normalizeQuestion(input);
    const all = [...errors, ...more];
    if (all.length) problems.push(`Câu ${i + 1}: ${all.join(' ')}`);
    accepted.push({ question, index: i, part: a.questions[i].part, points: Number(String(req.body[`q${i}_points`] || '').replace(',', '.')) || generator.DEFAULT_POINTS[question.type] });
    // Ghi lại chỉnh sửa vào bản phân tích để không mất khi phải sửa lỗi
    Object.assign(a.questions[i], {
      type: question.type, topic: question.topic, difficulty: question.difficulty, context: question.context, stem: question.stem,
      options: question.data.options || a.questions[i].options, statements: question.data.statements || a.questions[i].statements,
      answer: question.type === 'tf' ? null : question.data.answer, answers: question.data.answers || null, decimals: question.data.decimals ?? 2,
      explanation: question.explanation,
    });
  }
  await db.query('UPDATE sample_uploads SET analysis_json = ? WHERE id = ?', [JSON.stringify(a), up.id]);
  if (!accepted.length) throw new LmsError('Chưa chọn câu nào để lưu.');
  if (problems.length) throw new LmsError(`Còn ${problems.length} câu cần sửa — ${problems.slice(0, 5).join(' | ')}`);

  const family = `mau-${up.id}`;
  const ids = [];
  for (const it of accepted) {
    ids.push(await lms.saveBankQuestion({ ...it.question, family: it.question.family || `${family}-${it.index + 1}` }, { userId: req.user.id }));
  }
  const notes = [`Đã lưu ${ids.length} câu vào ngân hàng.`];
  const items = accepted.map((it, k) => ({ ...it.question, bankQuestionId: ids[k], part: it.part, points: it.points, data: it.question.type === 'short' ? bankLib.instantiate(it.question, { useDefault: true }).data : it.question.data }));

  let blueprintId = null;
  if (req.body.make_blueprint === '1') {
    const structure = generator.structureFromItems(items);
    const name = String(req.body.blueprint_name || '').trim().slice(0, 200) || `Khung đề theo ${up.filename}`;
    const kind = KINDS[req.body.kind] ? req.body.kind : 'exam';
    const duration = toInt(req.body.duration_min) || a.durationMin || null;
    const r = await db.query('INSERT INTO blueprints (name, kind, duration_min, structure_json, source_note, created_by) VALUES (?, ?, ?, ?, ?, ?)', [
      name, kind, duration, JSON.stringify(structure), `Phân tích từ đề mẫu "${up.filename}"`, req.user.id,
    ]);
    blueprintId = r.insertId;
    notes.push(`Đã tạo khung đề "${name}".`);
  }
  if (req.body.make_original === '1') {
    const examId = await lms.createExam({
      title: a.title || up.filename, kind: KINDS[req.body.kind] ? req.body.kind : 'exam', durationMin: toInt(req.body.duration_min) || a.durationMin, blueprintId,
      description: `Đề gốc từ file ${up.filename}`,
    }, items.map((it, k) => ({ ...it, context: it.context, explanation: it.explanation, position: k + 1 })), req.user.id);
    notes.push(`Đã tạo đề gốc #${examId}.`);
  }
  const versions = Math.min(5, Math.max(0, toInt(req.body.versions) || 0));
  if (versions && blueprintId) {
    const bp = await lms.getBlueprint(blueprintId);
    for (let v = 1; v <= versions; v += 1) {
      const { warnings } = await lms.generateExam({ blueprint: bp, title: `${bp.name} — đề tương tự số ${v}`, userId: req.user.id });
      if (v === 1 && warnings.length) notes.push(`Lưu ý khi sinh đề: ${warnings.slice(0, 3).join(' ')}`);
    }
    notes.push(`Đã sinh ${versions} đề tương tự.`);
  }
  a.saved = { at: new Date(), questions: ids.length, blueprintId };
  await db.query('UPDATE sample_uploads SET analysis_json = ? WHERE id = ?', [JSON.stringify(a), up.id]);
  req.flash('success', notes.join(' '));
  res.redirect(blueprintId || req.body.make_original === '1' ? '/quan-tri/de' : '/quan-tri/ngan-hang');
}, (req) => `/quan-tri/de-mau/${req.params.id}`));

router.post('/de-mau/:id/xoa', async (req, res) => {
  await db.query('DELETE FROM sample_uploads WHERE id = ?', [toInt(req.params.id)]);
  req.flash('success', 'Đã xoá bản phân tích đề mẫu (câu đã lưu vào ngân hàng vẫn giữ nguyên).');
  res.redirect('/quan-tri/de-mau');
});

// ===========================================================================
// KHUNG ĐỀ
// ===========================================================================

function readStructureForm(body) {
  const parts = [];
  for (let p = 0; p < 6; p += 1) {
    const type = body[`p${p}_type`];
    if (!type) continue;
    const slots = [];
    for (let s = 0; s < 30; s += 1) {
      const count = toInt(body[`p${p}_s${s}_count`]);
      if (!count) continue;
      slots.push({ topic: body[`p${p}_s${s}_topic`] || null, difficulty: toInt(body[`p${p}_s${s}_difficulty`]), count });
    }
    parts.push({ type, points: String(body[`p${p}_points`] || '').replace(',', '.'), slots });
  }
  return generator.normalizeStructure({ parts });
}

router.get('/khung-de/moi', (req, res) => {
  res.render('lms/admin/blueprint-form', {
    title: 'Tạo khung đề',
    bp: { name: '', kind: 'test', duration_min: 45, source_note: '', structure: { parts: [] } },
    formAction: '/quan-tri/khung-de',
    errors: [],
  });
});

async function saveBlueprint(req, res, existing) {
  const { structure, errors } = readStructureForm(req.body);
  const name = String(req.body.name || '').trim().slice(0, 200);
  if (!name) errors.unshift('Nhập tên khung đề.');
  const bp = {
    ...(existing || {}),
    name,
    kind: KINDS[req.body.kind] ? req.body.kind : 'test',
    duration_min: toInt(req.body.duration_min),
    source_note: String(req.body.source_note || '').trim().slice(0, 300),
    structure,
  };
  if (errors.length) {
    return res.render('lms/admin/blueprint-form', { title: existing ? 'Sửa khung đề' : 'Tạo khung đề', bp, formAction: req.originalUrl, errors });
  }
  if (existing) {
    await db.query('UPDATE blueprints SET name = ?, kind = ?, duration_min = ?, structure_json = ?, source_note = ? WHERE id = ?', [
      bp.name, bp.kind, bp.duration_min, JSON.stringify(structure), bp.source_note || null, existing.id,
    ]);
    await lms.logEdit('blueprint', existing.id, 'update', { before: existing.structure }, req.user.id);
  } else {
    await db.query('INSERT INTO blueprints (name, kind, duration_min, structure_json, source_note, created_by) VALUES (?, ?, ?, ?, ?, ?)', [
      bp.name, bp.kind, bp.duration_min, JSON.stringify(structure), bp.source_note || null, req.user.id,
    ]);
  }
  const sum = generator.summarize(structure);
  req.flash('success', `Đã lưu khung đề "${bp.name}" (${sum.questions} câu, ${score(sum.points)} điểm).`);
  res.redirect('/quan-tri/de#khung-de');
}

router.post('/khung-de', (req, res) => saveBlueprint(req, res, null));

router.get('/khung-de/:id', async (req, res) => {
  const bp = await lms.getBlueprint(toInt(req.params.id));
  if (!bp) return notFound(res);
  res.render('lms/admin/blueprint-form', { title: 'Sửa khung đề', bp, formAction: `/quan-tri/khung-de/${bp.id}`, errors: [] });
});

router.post('/khung-de/:id', async (req, res) => {
  const bp = await lms.getBlueprint(toInt(req.params.id));
  if (!bp) return notFound(res);
  if (bp.created_by !== req.user.id && !lms.isAdmin(req.user) && bp.created_by !== null) return forbidden(res, 'Chỉ người tạo khung đề hoặc quản trị viên được sửa.');
  if (bp.created_by === null && !lms.isAdmin(req.user)) return forbidden(res, 'Khung đề có sẵn chỉ quản trị viên được sửa. Bạn có thể tạo khung đề mới.');
  await saveBlueprint(req, res, bp);
});

router.post('/khung-de/:id/xoa', action(async (req, res) => {
  const bp = await lms.getBlueprint(toInt(req.params.id));
  if (!bp) return notFound(res);
  if (!(lms.isAdmin(req.user) || (bp.created_by && bp.created_by === req.user.id))) return forbidden(res);
  await db.query('DELETE FROM blueprints WHERE id = ?', [bp.id]);
  req.flash('success', `Đã xoá khung đề "${bp.name}" (các đề đã sinh vẫn giữ nguyên).`);
  res.redirect('/quan-tri/de#khung-de');
}));

// ===========================================================================
// ĐỀ
// ===========================================================================

async function loadExam(req, res) {
  const exam = await db.one('SELECT * FROM exams WHERE id = ?', [toInt(req.params.id)]);
  if (!exam || !lms.canManageExam(req.user, exam)) {
    notFound(res);
    return null;
  }
  return exam;
}

router.get('/de', async (req, res) => {
  const where = lms.isAdmin(req.user) ? 'e.is_personal = 0' : 'e.is_personal = 0 AND e.created_by = ?';
  const exams = await db.query(
    `SELECT e.*, u.name AS author, (SELECT COUNT(*) FROM exam_items i WHERE i.exam_id = e.id) AS item_count,
            (SELECT COALESCE(SUM(points), 0) FROM exam_items i WHERE i.exam_id = e.id) AS total_points,
            (SELECT COUNT(*) FROM assignments a WHERE a.exam_id = e.id) AS assignment_count
       FROM exams e LEFT JOIN users u ON u.id = e.created_by WHERE ${where} ORDER BY e.updated_at DESC LIMIT 200`,
    lms.isAdmin(req.user) ? [] : [req.user.id]
  );
  const blueprints = (await db.query('SELECT * FROM blueprints ORDER BY source_key IS NULL, id')).map((b) => {
    const bp = lms.blueprintFromRow(b);
    return { ...bp, summary: generator.summarize(bp.structure) };
  });
  res.render('lms/admin/exams', { title: 'Đề kiểm tra', exams, blueprints, KINDS });
});

router.get('/de/sinh', async (req, res) => {
  const blueprints = (await db.query('SELECT * FROM blueprints ORDER BY source_key IS NULL, id')).map(lms.blueprintFromRow);
  const counts = await db.query('SELECT topic, type, COUNT(*) AS n FROM bank_questions GROUP BY topic, type');
  res.render('lms/admin/generate', {
    title: 'Sinh đề tự động',
    blueprints: blueprints.map((b) => ({ ...b, summary: generator.summarize(b.structure), needsTopics: b.structure.parts.some((p) => p.slots.some((s) => !s.topic)) })),
    selected: toInt(req.query.khung) || blueprints[0]?.id,
    counts,
    KINDS,
  });
});

router.post('/de/sinh', action(async (req, res) => {
  const bp = await lms.getBlueprint(toInt(req.body.blueprint_id));
  if (!bp) throw new LmsError('Chọn khung đề.');
  const topics = [].concat(req.body.topics || []).filter((t) => getTopic(t).lessons.length);
  const needsTopics = bp.structure.parts.some((p) => p.slots.some((s) => !s.topic));
  if (needsTopics && !topics.length) throw new LmsError('Khung đề này cần chọn ít nhất một chủ đề.');
  const versions = Math.min(10, Math.max(1, toInt(req.body.versions) || 1));
  const baseTitle = String(req.body.title || '').trim().slice(0, 180) || bp.name;
  const kind = KINDS[req.body.kind] ? req.body.kind : bp.kind;
  const duration = req.body.duration_min === '' ? null : toInt(req.body.duration_min) ?? bp.duration_min;
  const created = [];
  let warnings = [];
  for (let v = 1; v <= versions; v += 1) {
    const result = await lms.generateExam({
      blueprint: bp,
      title: versions > 1 ? `${baseTitle} — đề ${v}` : baseTitle,
      kind,
      durationMin: duration,
      topics,
      description: String(req.body.description || '').trim() || null,
      userId: req.user.id,
    });
    created.push(result.examId);
    if (v === 1) warnings = result.warnings;
  }
  let msg = versions > 1 ? `Đã sinh ${versions} đề.` : 'Đã sinh đề mới.';
  if (warnings.length) msg += ` Lưu ý: ${warnings.slice(0, 4).join(' ')}${warnings.length > 4 ? ` (và ${warnings.length - 4} lưu ý khác)` : ''}`;
  req.flash(warnings.some((w) => w.includes('đề thiếu')) ? 'error' : 'success', msg);
  res.redirect(versions > 1 ? '/quan-tri/de' : `/quan-tri/de/${created[0]}`);
}, '/quan-tri/de/sinh'));

router.post('/de/moi', action(async (req, res) => {
  const title = String(req.body.title || '').trim().slice(0, 200);
  if (!title) throw new LmsError('Nhập tên đề.');
  const examId = await lms.createExam({ title, kind: KINDS[req.body.kind] ? req.body.kind : 'test', durationMin: toInt(req.body.duration_min) }, [], req.user.id);
  req.flash('success', 'Đã tạo đề trống. Thêm câu hỏi từ ngân hàng.');
  res.redirect(`/quan-tri/de/${examId}`);
}, '/quan-tri/de'));

router.get('/de/:id', async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const items = await lms.getExamItems(exam.id);
  const assignments = await db.query(
    'SELECT a.*, c.name AS class_name FROM assignments a LEFT JOIN classes c ON c.id = a.class_id WHERE a.exam_id = ? ORDER BY a.id DESC',
    [exam.id]
  );
  res.render('lms/admin/exam-detail', {
    title: exam.title,
    exam,
    parts: prepareExam(items),
    total: items.reduce((s, it) => s + it.points, 0),
    hasAttempts: await lms.examHasAttempts(exam.id),
    assignments,
    history: await lms.editHistory('exam', exam.id),
    KINDS,
  });
});

router.post('/de/:id', action(async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const title = String(req.body.title || '').trim().slice(0, 200);
  if (!title) throw new LmsError('Nhập tên đề.');
  await db.query('UPDATE exams SET title = ?, kind = ?, duration_min = ?, description = ? WHERE id = ?', [
    title, KINDS[req.body.kind] ? req.body.kind : exam.kind, toInt(req.body.duration_min), String(req.body.description || '').trim() || null, exam.id,
  ]);
  await lms.logEdit('exam', exam.id, 'update-meta', { title: exam.title, duration: exam.duration_min }, req.user.id);
  req.flash('success', 'Đã lưu thông tin đề.');
  res.redirect(`/quan-tri/de/${exam.id}`);
}));

router.get('/de/:id/xem', async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const items = await lms.getExamItems(exam.id);
  res.render('lms/admin/exam-print', { title: exam.title, exam, parts: prepareExam(items), showAnswers: req.query.dap_an !== '0', total: items.reduce((s, it) => s + it.points, 0), KINDS });
});

router.post('/de/:id/nhan-ban', async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const items = await lms.getExamItems(exam.id);
  const id = await lms.createExam({ title: `${exam.title} (bản sao)`, kind: exam.kind, description: exam.description, durationMin: exam.duration_min, blueprintId: exam.blueprint_id }, items, req.user.id);
  req.flash('success', 'Đã nhân bản đề — bạn có thể sửa bản sao thoải mái.');
  res.redirect(`/quan-tri/de/${id}`);
});

router.post('/de/:id/xoa', action(async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const { n } = await db.one('SELECT COUNT(*) AS n FROM assignments WHERE exam_id = ?', [exam.id]);
  if (n > 0) throw new LmsError('Đề đã được giao nên không thể xoá. Hãy xoá các bài giao trước (kết quả của học viên sẽ mất).');
  await db.query('DELETE FROM exams WHERE id = ?', [exam.id]);
  req.flash('success', `Đã xoá đề "${exam.title}".`);
  res.redirect('/quan-tri/de');
}));

// Thêm câu từ ngân hàng
router.post('/de/:id/them', action(async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  if (await lms.examHasAttempts(exam.id)) throw new LmsError('Đề đã có học viên làm — không thể thêm câu. Hãy nhân bản đề để chỉnh sửa.');
  const ids = [].concat(req.body.ids || req.body.id || []).map(toInt).filter(Boolean);
  if (!ids.length) throw new LmsError('Chọn câu hỏi cần thêm.');
  const items = await lms.getExamItems(exam.id);
  let position = items.length;
  for (const id of ids) {
    const q = await lms.getBankQuestion(id);
    if (!q) continue;
    const concrete = bankLib.instantiate(q);
    const sameType = items.find((it) => it.type === q.type);
    const part = sameType ? sameType.part : (Math.max(0, ...items.map((it) => it.part)) + 1);
    position += 1;
    await lms.insertExamItem(db.query, exam.id, position, {
      ...concrete, part, points: sameType ? sameType.points : generator.DEFAULT_POINTS[q.type], bankQuestionId: q.id,
    });
  }
  await lms.renumberExam(exam.id);
  await lms.logEdit('exam', exam.id, 'add-items', { ids }, req.user.id);
  req.flash('success', `Đã thêm ${ids.length} câu vào đề.`);
  res.redirect(req.body.back === 'bank' ? `/quan-tri/ngan-hang?${new URLSearchParams({ them_vao: exam.id, ...(req.body.query ? Object.fromEntries(new URLSearchParams(req.body.query)) : {}) })}` : `/quan-tri/de/${exam.id}`);
}));

async function loadItem(req, res, exam) {
  const row = await db.one('SELECT * FROM exam_items WHERE id = ? AND exam_id = ?', [toInt(req.params.itemId), exam.id]);
  if (!row) {
    notFound(res);
    return null;
  }
  return lms.itemFromRow(row);
}

router.post('/de/:id/cau/:itemId/:op', action(async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const item = await loadItem(req, res, exam);
  if (!item) return;
  const op = req.params.op;
  const locked = await lms.examHasAttempts(exam.id);
  if (locked && op !== 'diem') throw new LmsError('Đề đã có học viên làm — chỉ được sửa nội dung/đáp án từng câu (hệ thống sẽ chấm lại). Muốn đổi cấu trúc, hãy nhân bản đề.');
  const items = await lms.getExamItems(exam.id);
  if (op === 'xoa') {
    await db.query('DELETE FROM exam_items WHERE id = ?', [item.id]);
    await lms.renumberExam(exam.id);
  } else if (op === 'len' || op === 'xuong') {
    const samePart = items.filter((it) => it.part === item.part);
    const idx = samePart.findIndex((it) => it.id === item.id);
    const other = samePart[op === 'len' ? idx - 1 : idx + 1];
    if (other) {
      await db.query('UPDATE exam_items SET position = ? WHERE id = ?', [other.position, item.id]);
      await db.query('UPDATE exam_items SET position = ? WHERE id = ?', [item.position, other.id]);
    }
  } else if (op === 'doi' || op === 'doi-so') {
    // Đổi sang câu khác cùng dạng/chủ đề/mức độ, hoặc giữ câu nhưng đổi bộ số liệu
    let source = null;
    if (op === 'doi-so') {
      source = item.bankQuestionId ? await lms.getBankQuestion(item.bankQuestionId) : null;
      if (!source?.template) throw new LmsError('Câu này không có biến thể số liệu.');
    } else {
      const used = new Set(items.map((it) => it.bankQuestionId));
      const pool = (await lms.loadBank([item.type])).filter((q) => q.topic === item.topic && !used.has(q.id));
      const usedFamilies = new Set();
      for (const it of items) {
        if (it.bankQuestionId) {
          const fam = pool.find((q) => q.id === it.bankQuestionId)?.family;
          if (fam) usedFamilies.add(fam);
        }
      }
      const candidates = pool.filter((q) => !usedFamilies.has(q.family));
      source = generator.shuffle(candidates.filter((q) => q.difficulty === item.difficulty), Math.random)[0]
        || generator.shuffle(candidates, Math.random)[0];
      if (!source) throw new LmsError('Ngân hàng không còn câu nào khác cùng dạng và chủ đề.');
    }
    const c = bankLib.instantiate(source);
    await db.query(
      'UPDATE exam_items SET bank_question_id = ?, type = ?, topic = ?, difficulty = ?, context_md = ?, stem_md = ?, data_json = ?, explanation_md = ? WHERE id = ?',
      [source.id, c.type, c.topic, c.difficulty, c.context || null, c.stem, JSON.stringify(c.data), c.explanation || null, item.id]
    );
  } else if (op === 'diem') {
    if (locked) throw new LmsError('Đề đã có học viên làm — không đổi điểm từng câu. Dùng chức năng chỉnh điểm trong bài làm.');
    const points = Number(String(req.body.points || '').replace(',', '.'));
    if (!(points > 0 && points <= 100)) throw new LmsError('Điểm câu phải lớn hơn 0.');
    await db.query('UPDATE exam_items SET points = ? WHERE id = ?', [points, item.id]);
  } else {
    return notFound(res);
  }
  await lms.logEdit('exam', exam.id, `item-${op}`, { itemId: item.id, position: item.position }, req.user.id);
  res.redirect(`/quan-tri/de/${exam.id}#cau-${item.id}`);
}));

// Đổi điểm của cả một phần
router.post('/de/:id/phan/:part/diem', action(async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  if (await lms.examHasAttempts(exam.id)) throw new LmsError('Đề đã có học viên làm — không đổi thang điểm. Hãy nhân bản đề.');
  const points = Number(String(req.body.points || '').replace(',', '.'));
  if (!(points > 0 && points <= 100)) throw new LmsError('Điểm mỗi câu phải lớn hơn 0.');
  await db.query('UPDATE exam_items SET points = ? WHERE exam_id = ? AND part = ?', [points, exam.id, toInt(req.params.part)]);
  await lms.logEdit('exam', exam.id, 'part-points', { part: toInt(req.params.part), points }, req.user.id);
  req.flash('success', 'Đã đổi điểm cho các câu trong phần.');
  res.redirect(`/quan-tri/de/${exam.id}`);
}));

router.get('/de/:id/cau/:itemId', async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const item = await loadItem(req, res, exam);
  if (!item) return;
  renderQuestionForm(res, {
    title: `Sửa câu ${item.position} trong đề`,
    values: formValues(item),
    action: `/quan-tri/de/${exam.id}/cau/${item.id}`,
    back: `/quan-tri/de/${exam.id}#cau-${item.id}`,
    preview: previewOf(item),
    extra: { examItem: item, exam, hasAttempts: await lms.examHasAttempts(exam.id) },
  });
});

router.post('/de/:id/cau/:itemId', async (req, res) => {
  const exam = await loadExam(req, res);
  if (!exam) return;
  const item = await loadItem(req, res, exam);
  if (!item) return;
  const { input, errors } = readQuestionForm(req.body);
  const { question, errors: more } = bankLib.normalizeQuestion(input);
  const all = [...errors, ...more];
  const hasAttempts = await lms.examHasAttempts(exam.id);
  if (hasAttempts && question.type !== item.type) all.push('Đề đã có học viên làm — không được đổi dạng câu.');
  if (all.length) {
    return renderQuestionForm(res, {
      title: `Sửa câu ${item.position} trong đề`, values: formValues(question), errors: all, action: `/quan-tri/de/${exam.id}/cau/${item.id}`,
      back: `/quan-tri/de/${exam.id}`, extra: { examItem: item, exam, hasAttempts },
    });
  }
  // Câu trong đề lưu dạng cụ thể (không còn biến): nếu có template thì lấy bộ số mặc định
  const concrete = question.template ? bankLib.instantiate(question, { useDefault: true }) : question;
  await db.query(
    'UPDATE exam_items SET type = ?, topic = ?, difficulty = ?, context_md = ?, stem_md = ?, data_json = ?, explanation_md = ? WHERE id = ?',
    [concrete.type, concrete.topic, concrete.difficulty, concrete.context || null, concrete.stem, JSON.stringify(concrete.data), concrete.explanation || null, item.id]
  );
  await lms.logEdit('exam', exam.id, 'item-edit', { itemId: item.id, position: item.position, before: { stem: item.stem, data: item.data } }, req.user.id);
  let msg = `Đã lưu câu ${item.position}.`;
  if (hasAttempts) {
    const n = await lms.regradeExamItem(item.id, req.user.id);
    msg += n ? ` Đã chấm lại ${n} bài làm bị ảnh hưởng.` : ' Không có bài làm nào thay đổi điểm.';
  }
  req.flash('success', msg);
  res.redirect(`/quan-tri/de/${exam.id}#cau-${item.id}`);
});

// ===========================================================================
// GIAO BÀI
// ===========================================================================

async function loadAssignment(req, res) {
  const a = await lms.getAssignment(toInt(req.params.id));
  if (!a || !lms.canManageAssignment(req.user, a) || a.is_auto_practice) {
    notFound(res);
    return null;
  }
  return a;
}

router.get('/giao-bai', async (req, res) => {
  const where = lms.isAdmin(req.user) ? 'a.is_auto_practice = 0' : 'a.is_auto_practice = 0 AND (a.created_by = ? OR c.teacher_id = ?)';
  const rows = await db.query(
    `SELECT a.*, e.title AS exam_title, c.name AS class_name,
            (SELECT COUNT(*) FROM assignment_targets t WHERE t.assignment_id = a.id) AS direct_targets,
            (SELECT COUNT(*) FROM class_members m WHERE m.class_id = a.class_id) AS class_size,
            (SELECT COUNT(DISTINCT t.user_id) FROM attempts t WHERE t.assignment_id = a.id AND t.status = 'submitted') AS submitted
       FROM assignments a JOIN exams e ON e.id = a.exam_id LEFT JOIN classes c ON c.id = a.class_id
      WHERE ${where} ORDER BY a.created_at DESC LIMIT 200`,
    lms.isAdmin(req.user) ? [] : [req.user.id, req.user.id]
  );
  res.render('lms/admin/assignments', { title: 'Giao bài', assignments: rows });
});

async function assignmentFormData(req) {
  const examWhere = lms.isAdmin(req.user) ? 'is_personal = 0' : 'is_personal = 0 AND created_by = ?';
  const exams = await db.query(`SELECT id, title, kind, duration_min FROM exams WHERE ${examWhere} ORDER BY updated_at DESC LIMIT 300`, lms.isAdmin(req.user) ? [] : [req.user.id]);
  const classes = (await lms.classesFor(req.user)).filter((c) => !c.archived);
  const members = classes.length
    ? await db.query('SELECT m.class_id, u.id, u.name, u.email FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id IN (?) ORDER BY u.name', [classes.map((c) => c.id)])
    : [];
  return { exams, classes: classes.map((c) => ({ ...c, members: members.filter((m) => m.class_id === c.id) })), SHOW_ANSWERS };
}

function defaultsForKind(kind) {
  return kind === 'practice' ? { max_attempts: 0, score_policy: 'best' } : { max_attempts: 1, score_policy: 'best' };
}

router.get('/giao-bai/moi', async (req, res) => {
  const data = await assignmentFormData(req);
  const exam = data.exams.find((e) => e.id === toInt(req.query.de)) || null;
  res.render('lms/admin/assignment-form', {
    title: 'Giao bài mới',
    ...data,
    values: {
      exam_id: exam?.id || '', class_id: toInt(req.query.lop) || '', title: exam?.title || '', instructions: '',
      open_at: '', due_at: '', duration_min: exam?.duration_min || '', ...defaultsForKind(exam?.kind),
      show_answers: 'after_submit', auto_practice: 1, targets: [],
    },
    formAction: '/quan-tri/giao-bai',
    errors: [],
  });
});

function readAssignmentForm(body) {
  const v = {
    exam_id: toInt(body.exam_id),
    class_id: toInt(body.class_id),
    title: String(body.title || '').trim().slice(0, 200),
    instructions: String(body.instructions || '').trim().slice(0, 5000),
    open_at: time.parseLocalInput(body.open_at),
    due_at: time.parseLocalInput(body.due_at),
    duration_min: toInt(body.duration_min),
    max_attempts: Math.max(0, Math.min(100, toInt(body.max_attempts) ?? 1)),
    score_policy: body.score_policy === 'last' ? 'last' : 'best',
    show_answers: SHOW_ANSWERS[body.show_answers] ? body.show_answers : 'after_submit',
    auto_practice: body.auto_practice === '1' ? 1 : 0,
    targets: [...new Set([].concat(body.targets || []).map(toInt).filter(Boolean))],
    target_mode: body.target_mode === 'some' ? 'some' : 'class',
  };
  const errors = [];
  if (!v.exam_id) errors.push('Chọn đề.');
  if (!v.title) errors.push('Nhập tiêu đề bài giao.');
  if (!v.class_id && !v.targets.length) errors.push('Chọn lớp hoặc ít nhất một học viên.');
  if (v.target_mode === 'some' && !v.targets.length) errors.push('Chọn học viên cần giao (hoặc chọn "Cả lớp").');
  if (v.open_at && v.due_at && v.due_at <= v.open_at) errors.push('Hạn nộp phải sau thời gian mở bài.');
  if (v.duration_min !== null && (v.duration_min < 1 || v.duration_min > 600)) errors.push('Thời gian làm bài từ 1 đến 600 phút (để trống nếu không giới hạn).');
  if (v.target_mode === 'class') v.targets = [];
  return { v, errors };
}

async function validateAssignmentAccess(req, v, data) {
  const errors = [];
  if (v.exam_id && !data.exams.some((e) => e.id === v.exam_id)) errors.push('Đề không hợp lệ.');
  if (v.class_id && !data.classes.some((c) => c.id === v.class_id)) errors.push('Lớp không hợp lệ.');
  if (v.targets.length) {
    const allowed = new Set((await lms.studentsFor(req.user)).map((s) => s.id));
    if (v.targets.some((id) => !allowed.has(id))) errors.push('Chỉ giao được cho học viên trong lớp của bạn.');
  }
  if (v.exam_id) {
    const { n } = await db.one('SELECT COUNT(*) AS n FROM exam_items WHERE exam_id = ?', [v.exam_id]);
    if (!n) errors.push('Đề chưa có câu hỏi nào.');
  }
  return errors;
}

router.post('/giao-bai', async (req, res) => {
  const data = await assignmentFormData(req);
  const { v, errors } = readAssignmentForm(req.body);
  errors.push(...(await validateAssignmentAccess(req, v, data)));
  if (errors.length) {
    return res.render('lms/admin/assignment-form', {
      title: 'Giao bài mới', ...data, values: { ...v, open_at: req.body.open_at, due_at: req.body.due_at }, formAction: '/quan-tri/giao-bai', errors,
    });
  }
  const id = await lms.withTransaction(async (q) => {
    const r = await q(
      `INSERT INTO assignments (exam_id, class_id, title, instructions, open_at, due_at, duration_min, max_attempts, score_policy, show_answers, auto_practice, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.exam_id, v.class_id, v.title, v.instructions || null, v.open_at, v.due_at, v.duration_min, v.max_attempts, v.score_policy, v.show_answers, v.auto_practice, req.user.id]
    );
    for (const uid of v.targets) await q('INSERT INTO assignment_targets (assignment_id, user_id) VALUES (?, ?)', [r.insertId, uid]);
    await lms.logEdit('assignment', r.insertId, 'create', null, req.user.id, q);
    return r.insertId;
  });
  req.flash('success', `Đã giao bài "${v.title}".`);
  res.redirect(`/quan-tri/giao-bai/${id}`);
});

router.get('/giao-bai/:id/sua', async (req, res) => {
  const a = await loadAssignment(req, res);
  if (!a) return;
  const data = await assignmentFormData(req);
  if (!data.exams.some((e) => e.id === a.exam_id)) data.exams.unshift({ id: a.exam_id, title: a.exam_title, kind: a.exam_kind });
  const targets = (await db.query('SELECT user_id FROM assignment_targets WHERE assignment_id = ?', [a.id])).map((r) => r.user_id);
  res.render('lms/admin/assignment-form', {
    title: 'Sửa bài giao',
    ...data,
    values: { ...a, open_at: time.toLocalInput(a.open_at), due_at: time.toLocalInput(a.due_at), targets, target_mode: targets.length ? 'some' : 'class' },
    formAction: `/quan-tri/giao-bai/${a.id}`,
    errors: [],
    editing: a,
  });
});

router.post('/giao-bai/:id', async (req, res) => {
  const a = await loadAssignment(req, res);
  if (!a) return;
  const data = await assignmentFormData(req);
  if (!data.exams.some((e) => e.id === a.exam_id)) data.exams.unshift({ id: a.exam_id, title: a.exam_title, kind: a.exam_kind });
  const { v, errors } = readAssignmentForm(req.body);
  errors.push(...(await validateAssignmentAccess(req, v, data)));
  const { n } = await db.one('SELECT COUNT(*) AS n FROM attempts WHERE assignment_id = ?', [a.id]);
  if (n > 0 && v.exam_id !== a.exam_id) errors.push('Đã có học viên làm bài — không đổi được đề.');
  if (errors.length) {
    return res.render('lms/admin/assignment-form', {
      title: 'Sửa bài giao', ...data, values: { ...v, open_at: req.body.open_at, due_at: req.body.due_at }, formAction: `/quan-tri/giao-bai/${a.id}`, errors, editing: a,
    });
  }
  await lms.withTransaction(async (q) => {
    await q(
      `UPDATE assignments SET exam_id = ?, class_id = ?, title = ?, instructions = ?, open_at = ?, due_at = ?, duration_min = ?, max_attempts = ?,
              score_policy = ?, show_answers = ?, auto_practice = ? WHERE id = ?`,
      [v.exam_id, v.class_id, v.title, v.instructions || null, v.open_at, v.due_at, v.duration_min, v.max_attempts, v.score_policy, v.show_answers, v.auto_practice, a.id]
    );
    await q('DELETE FROM assignment_targets WHERE assignment_id = ?', [a.id]);
    for (const uid of v.targets) await q('INSERT INTO assignment_targets (assignment_id, user_id) VALUES (?, ?)', [a.id, uid]);
    await lms.logEdit('assignment', a.id, 'update', {
      before: { due_at: a.due_at, open_at: a.open_at, duration_min: a.duration_min, max_attempts: a.max_attempts, show_answers: a.show_answers },
    }, req.user.id, q);
  });
  req.flash('success', 'Đã lưu bài giao.');
  res.redirect(`/quan-tri/giao-bai/${a.id}`);
});

router.post('/giao-bai/:id/xoa', async (req, res) => {
  const a = await loadAssignment(req, res);
  if (!a) return;
  await db.query('DELETE FROM assignments WHERE id = ?', [a.id]);
  await lms.logEdit('assignment', a.id, 'delete', { title: a.title }, req.user.id);
  req.flash('success', `Đã xoá bài giao "${a.title}" và các bài làm liên quan.`);
  res.redirect('/quan-tri/giao-bai');
});

// Theo dõi tiến độ + thống kê một bài giao
router.get('/giao-bai/:id', async (req, res) => {
  const a = await loadAssignment(req, res);
  if (!a) return;
  const targets = await lms.assignmentTargets(a);
  const attempts = await db.query('SELECT * FROM attempts WHERE assignment_id = ? ORDER BY id', [a.id]);
  const extraIds = [...new Set(attempts.map((t) => t.user_id))].filter((id) => !targets.some((t) => t.id === id));
  const extras = extraIds.length ? await db.query('SELECT id, name, email FROM users WHERE id IN (?)', [extraIds]) : [];
  const rows = [...targets, ...extras.map((u) => ({ ...u, notTarget: true }))].map((u) => {
    const mine = attempts.filter((t) => t.user_id === u.id);
    const s = lms.summarizeAttempts(a, mine);
    const usedSec = s.counted && s.counted.submitted_at ? (new Date(s.counted.submitted_at) - new Date(s.counted.started_at)) / 1000 : null;
    return { ...u, ...s, attempts: mine, usedSec };
  });
  const items = await lms.getExamItems(a.exam_id);
  const countedIds = rows.map((r) => r.counted?.id).filter(Boolean);
  const answerRows = countedIds.length
    ? await db.query('SELECT exam_item_id, response_json, COALESCE(override_points, auto_points) AS points, max_points FROM attempt_items WHERE attempt_id IN (?)', [countedIds])
    : [];
  const stats = itemStatistics(items, answerRows.map((r) => ({ ...r, response: r.response_json ? JSON.parse(r.response_json) : null })));
  const analyses = rows.filter((r) => r.counted).map((r) => JSON.parse(r.counted.analysis_json || '{}'));
  const errorTotals = {};
  analyses.forEach((an) => (an.errorSummary || []).forEach((e) => { errorTotals[e.kind] = (errorTotals[e.kind] || 0) + e.count; }));
  const scores = rows.filter((r) => r.score10 !== null).map((r) => r.score10);

  if (req.query.csv === '1') {
    const header = ['Học viên', 'Email', 'Trạng thái', 'Số lần nộp', 'Điểm', 'Điểm tối đa', 'Thang 10', 'Nộp trễ', 'Nộp lúc', 'Thời gian làm (phút)'];
    const data = rows.map((r) => [
      r.name, r.email, lms.STATUS_LABELS[r.status], r.attemptsUsed, r.counted ? Number(r.counted.score) : '', r.counted ? Number(r.counted.max_score) : '',
      r.score10 ?? '', r.counted?.is_late ? 'Có' : '', r.counted ? time.formatDateTime(r.counted.submitted_at) : '', r.usedSec ? Math.round(r.usedSec / 6) / 10 : '',
    ]);
    return sendCsv(res, `ket-qua-${a.title}`, [header, ...data]);
  }
  const parts = prepareExam(items);
  res.render('lms/admin/assignment-detail', {
    title: a.title,
    a,
    rows,
    stats,
    statsById: Object.fromEntries(stats.map((s) => [s.id, s])),
    parts,
    mastery: mergeTopicStats(analyses),
    errorTotals: Object.entries(errorTotals).map(([kind, count]) => ({ kind, label: ERROR_LABELS[kind], count })).sort((x, y) => y.count - x.count),
    summary: {
      targets: targets.length,
      submitted: rows.filter((r) => r.counted).length,
      late: rows.filter((r) => r.counted?.is_late).length,
      doing: rows.filter((r) => r.status === 'doing').length,
      avg: scores.length ? Math.round((scores.reduce((x, y) => x + y, 0) / scores.length) * 100) / 100 : null,
      max: scores.length ? Math.max(...scores) : null,
      min: scores.length ? Math.min(...scores) : null,
    },
    histogramChart: scores.length ? histogram(scores) : '',
    STATUS_LABELS: lms.STATUS_LABELS,
    SHOW_ANSWERS,
    history: await lms.editHistory('assignment', a.id),
  });
});

// ===========================================================================
// XEM & CHẤM BÀI LÀM
// ===========================================================================

async function loadAttemptForStaff(req, res) {
  const attempt = await db.one('SELECT t.*, u.name AS student_name, u.email AS student_email FROM attempts t JOIN users u ON u.id = t.user_id WHERE t.id = ?', [toInt(req.params.id)]);
  if (!attempt) {
    notFound(res);
    return null;
  }
  const a = await lms.getAssignment(attempt.assignment_id);
  const allowed = a.is_auto_practice ? await lms.canViewStudent(req.user, attempt.user_id) : lms.canManageAssignment(req.user, a);
  if (!allowed) {
    notFound(res);
    return null;
  }
  return { attempt, a };
}

router.get('/bai-lam/:id', async (req, res) => {
  const loaded = await loadAttemptForStaff(req, res);
  if (!loaded) return;
  const { attempt, a } = loaded;
  const items = await lms.getExamItems(a.exam_id);
  const answerRows = await db.query('SELECT * FROM attempt_items WHERE attempt_id = ?', [attempt.id]);
  const byItem = Object.fromEntries(answerRows.map((r) => [r.exam_item_id, r]));
  const draft = attempt.status === 'in_progress' ? JSON.parse(attempt.answers_json || '{}') : {};
  for (const item of items) {
    const r = byItem[item.id];
    const response = r ? (r.response_json ? JSON.parse(r.response_json) : null) : draft[item.id] ?? null;
    item.result = r
      ? { id: r.id, response, auto: Number(r.auto_points), override: r.override_points === null ? null : Number(r.override_points), max: Number(r.max_points), correctParts: r.correct_parts }
      : { response, ...gradeItem(item, response), max: item.points, draft: true };
    item.responseText = responseText(item, response);
  }
  const audit = await db.query(
    `SELECT g.*, u.name AS user_name, ai.exam_item_id FROM grade_audit g LEFT JOIN users u ON u.id = g.changed_by
       LEFT JOIN attempt_items ai ON ai.id = g.attempt_item_id WHERE g.attempt_id = ? ORDER BY g.id DESC`,
    [attempt.id]
  );
  const positions = Object.fromEntries(items.map((it) => [it.id, it.position]));
  res.render('lms/admin/attempt-review', {
    title: `Bài làm của ${attempt.student_name}`,
    attempt,
    a,
    parts: prepareExam(items),
    analysis: attempt.analysis_json ? JSON.parse(attempt.analysis_json) : null,
    audit: audit.map((g) => ({ ...g, position: positions[g.exam_item_id] })),
    others: await db.query("SELECT id, score, max_score, submitted_at, status FROM attempts WHERE assignment_id = ? AND user_id = ? ORDER BY id", [a.id, attempt.user_id]),
  });
});

router.post('/bai-lam/:id/cau/:itemId', action(async (req, res) => {
  const loaded = await loadAttemptForStaff(req, res);
  if (!loaded) return;
  const row = await db.one('SELECT * FROM attempt_items WHERE id = ? AND attempt_id = ?', [toInt(req.params.itemId), loaded.attempt.id]);
  if (!row) return notFound(res);
  const reason = String(req.body.reason || '').trim().slice(0, 500);
  const reset = req.body.reset === '1';
  if (!reset && !reason) throw new LmsError('Nhập lí do chỉnh điểm (được lưu vào lịch sử chấm).');
  const raw = String(req.body.points ?? '').trim().replace(',', '.');
  if (!reset && (raw === '' || Number.isNaN(Number(raw)))) throw new LmsError('Nhập điểm hợp lệ.');
  await lms.overrideItemPoints(row.id, reset ? null : Number(raw), reset ? 'Khôi phục điểm chấm tự động' : reason, req.user.id);
  req.flash('success', 'Đã cập nhật điểm và tính lại tổng điểm, phân tích.');
  res.redirect(`/quan-tri/bai-lam/${loaded.attempt.id}#ai-${row.id}`);
}));

// ===========================================================================
// BÁO CÁO
// ===========================================================================

router.get('/bao-cao', async (req, res) => {
  const classes = await lms.classesFor(req.user);
  const reports = [];
  for (const cls of classes.filter((c) => !c.archived)) {
    const r = await classReport(cls);
    const avgs = r.students.map((s) => s.avg).filter((v) => v !== null);
    reports.push({
      cls,
      students: r.students.length,
      assignments: r.assignments.length,
      avg: avgs.length ? Math.round((avgs.reduce((x, y) => x + y, 0) / avgs.length) * 100) / 100 : null,
      attention: r.attention,
      weakest: r.mastery.slice(0, 3),
    });
  }
  const students = await lms.studentsFor(req.user);
  res.render('lms/admin/reports', { title: 'Báo cáo học tập', reports, students });
});

router.get('/hoc-vien/:id', async (req, res) => {
  const studentId = toInt(req.params.id);
  if (!(await lms.canViewStudent(req.user, studentId))) return notFound(res);
  const student = await db.one('SELECT id, name, email, created_at FROM users WHERE id = ?', [studentId]);
  if (!student) return notFound(res);
  const attempts = await db.query(
    `SELECT t.*, a.title, a.is_auto_practice, a.class_id, a.created_by AS assigned_by, c.teacher_id
       FROM attempts t JOIN assignments a ON a.id = t.assignment_id LEFT JOIN classes c ON c.id = a.class_id
      WHERE t.user_id = ? AND t.status = 'submitted' ORDER BY t.submitted_at`,
    [studentId]
  );
  // Giáo viên chỉ xem bài thuộc lớp/bài giao của mình và bài luyện tập cá nhân
  const visible = lms.isAdmin(req.user) ? attempts : attempts.filter((t) => t.is_auto_practice || t.teacher_id === req.user.id || t.assigned_by === req.user.id);
  const analyses = visible.map((t) => JSON.parse(t.analysis_json || '{}'));
  if (req.query.csv === '1') {
    const header = ['Bài', 'Loại', 'Nộp lúc', 'Điểm', 'Tối đa', 'Thang 10', 'Nộp trễ', 'Điểm mạnh', 'Cần ôn'];
    const rows = visible.map((t, i) => [
      t.title, t.is_auto_practice ? 'Luyện tập tự động' : 'Bài giao', time.formatDateTime(t.submitted_at), Number(t.score), Number(t.max_score),
      Math.round((t.score / t.max_score) * 1000) / 100, t.is_late ? 'Có' : '',
      (analyses[i].strengths || []).map((k) => getTopic(k).name).join('; '), (analyses[i].weaknesses || []).map((k) => getTopic(k).name).join('; '),
    ]);
    return sendCsv(res, `hoc-vien-${student.name}`, [header, ...rows]);
  }
  const errorTotals = {};
  analyses.forEach((an) => (an.errorSummary || []).forEach((e) => { errorTotals[e.kind] = (errorTotals[e.kind] || 0) + e.count; }));
  const classes = await db.query('SELECT c.id, c.name FROM class_members m JOIN classes c ON c.id = m.class_id WHERE m.user_id = ?', [studentId]);
  res.render('lms/admin/student-report', {
    title: `Học viên ${student.name}`,
    student,
    classes,
    attempts: visible.slice().reverse(),
    mastery: mergeTopicStats(analyses),
    errorTotals: Object.entries(errorTotals).map(([kind, count]) => ({ kind, label: ERROR_LABELS[kind], count })).sort((x, y) => y.count - x.count),
    chart: lineChart(visible.map((t) => ({ label: time.formatDate(t.submitted_at).slice(0, 5), value: (t.score / t.max_score) * 10, title: t.title })), { label: 'Điểm qua các bài (thang 10)' }),
  });
});

module.exports = router;
