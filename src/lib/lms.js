// Truy vấn và nghiệp vụ của hệ thống quản trị học tập: ngân hàng, đề, lớp, bài giao, bài làm, chấm điểm.
const crypto = require('node:crypto');
const db = require('../db');
const bank = require('./bank');
const generator = require('./generator');
const { gradeItem, roundPoints } = require('./grading');
const { analyzeAttempt, mergeTopicStats, nextDifficulty } = require('./analysis');
const { getTopic } = require('./topics');

class LmsError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const isAdmin = (user) => user && user.role === 'admin';
const isStaff = (user) => user && (user.role === 'teacher' || user.role === 'admin');

async function withTransaction(fn) {
  const conn = await db.pool.getConnection();
  try {
    await conn.beginTransaction();
    const q = async (sql, params = []) => (await conn.query(sql, params))[0];
    const result = await fn(q);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function logEdit(entity, entityId, action, detail, userId, q = db.query) {
  await q('INSERT INTO edit_log (entity, entity_id, action, detail_json, user_id) VALUES (?, ?, ?, ?, ?)', [
    entity,
    entityId,
    action,
    detail === undefined ? null : JSON.stringify(detail),
    userId || null,
  ]);
}

async function editHistory(entity, entityId) {
  return db.query(
    `SELECT e.*, u.name AS user_name FROM edit_log e LEFT JOIN users u ON u.id = e.user_id
      WHERE e.entity = ? AND e.entity_id = ? ORDER BY e.id DESC LIMIT 50`,
    [entity, entityId]
  );
}

// ---------------------------------------------------------------------------
// Ngân hàng câu hỏi
// ---------------------------------------------------------------------------

async function loadBank(types = ['mcq', 'tf', 'short']) {
  const rows = await db.query('SELECT * FROM bank_questions WHERE type IN (?)', [types]);
  return rows.map(bank.fromRow);
}

async function getBankQuestion(id) {
  const row = await db.one('SELECT * FROM bank_questions WHERE id = ?', [id]);
  return row ? bank.fromRow(row) : null;
}

// Thêm mới hoặc cập nhật (khi có id). Ghi lịch sử kèm bản cũ để có thể đối chiếu.
async function saveBankQuestion(question, { id = null, userId = null, sourceKey = null } = {}) {
  const v = bank.toRowValues(question);
  if (id) {
    const before = await getBankQuestion(id);
    if (!before) throw new LmsError('Câu hỏi không tồn tại.', 404);
    await db.query(
      `UPDATE bank_questions SET type=?, grade=?, topic=?, difficulty=?, context_md=?, stem_md=?, data_json=?,
              explanation_md=?, template_json=?, source=?, family=? WHERE id = ?`,
      [v.type, v.grade, v.topic, v.difficulty, v.context_md, v.stem_md, v.data_json, v.explanation_md, v.template_json, v.source, v.family, id]
    );
    await logEdit('bank', id, 'update', { before: { ...before, id: undefined } }, userId);
    return id;
  }
  const result = await db.query(
    `INSERT INTO bank_questions (type, grade, topic, difficulty, context_md, stem_md, data_json, explanation_md,
                                 template_json, source, source_key, family, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [v.type, v.grade, v.topic, v.difficulty, v.context_md, v.stem_md, v.data_json, v.explanation_md, v.template_json, v.source, sourceKey, v.family, userId]
  );
  await logEdit('bank', result.insertId, 'create', null, userId);
  return result.insertId;
}

// Nạp câu hỏi từ file nội dung (content/ngan-hang/*.js). Câu đã có (cùng key) được bỏ qua,
// hoặc cập nhật nếu update = true.
async function importBank(questions, { update = false } = {}) {
  const stats = { added: 0, updated: 0, skipped: 0, errors: [] };
  // Câu có sẵn mà giáo viên đã xoá thì không nạp lại
  const deleted = new Set(
    (await db.query("SELECT detail_json FROM edit_log WHERE entity = 'bank' AND action = 'delete' AND detail_json LIKE '%sourceKey%'"))
      .map((r) => JSON.parse(r.detail_json).sourceKey)
  );
  for (const raw of questions) {
    if (raw.key && deleted.has(raw.key) && !update) {
      stats.skipped += 1;
      continue;
    }
    const { question, errors } = bank.normalizeQuestion(raw);
    if (errors.length) {
      stats.errors.push(`${raw.key || raw.stem?.slice(0, 40)}: ${errors.join(' ')}`);
      continue;
    }
    const existing = raw.key ? await db.one('SELECT id FROM bank_questions WHERE source_key = ?', [raw.key]) : null;
    if (existing && !update) {
      stats.skipped += 1;
    } else if (existing) {
      await saveBankQuestion(question, { id: existing.id });
      stats.updated += 1;
    } else {
      await saveBankQuestion(question, { sourceKey: raw.key || null });
      stats.added += 1;
    }
  }
  return stats;
}

// Đồng bộ câu trắc nghiệm của bài học (bảng questions) vào ngân hàng; chủ đề lấy theo bài học.
async function importLessonQuestions() {
  const { TOPICS } = require('./topics');
  const lessonTopic = {};
  for (const t of TOPICS) for (const slug of t.lessons) lessonTopic[slug] = t;
  const rows = await db.query(
    `SELECT q.*, l.slug, l.title AS lesson_title FROM questions q JOIN lessons l ON l.id = q.lesson_id`
  );
  let added = 0;
  for (const r of rows) {
    const topic = lessonTopic[r.slug];
    if (!topic) continue;
    const key = `lesson-q-${r.id}`;
    if (await db.one('SELECT id FROM bank_questions WHERE source_key = ?', [key])) continue;
    const options = JSON.parse(r.options_json);
    const { question, errors } = bank.normalizeQuestion({
      type: 'mcq',
      grade: topic.grade,
      topic: topic.key,
      difficulty: /dang-bai/.test(r.slug) ? 2 : 1,
      stem: r.prompt_md,
      data: { options, answer: r.correct_index },
      explanation: r.explanation_md,
      source: `Bài học: ${r.lesson_title}`,
      family: key,
    });
    if (errors.length) continue;
    await saveBankQuestion(question, { sourceKey: key });
    added += 1;
  }
  return added;
}

// Nạp toàn bộ file trong content/ngan-hang (bỏ qua câu đã có) — chạy khi khởi động.
function bankFiles() {
  const fs = require('node:fs');
  const path = require('node:path');
  const dir = path.join(__dirname, '..', '..', 'content', 'ngan-hang');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort().map((f) => path.join(dir, f));
}

async function seedBank() {
  const totals = { added: 0, errors: [] };
  for (const file of bankFiles()) {
    const stats = await importBank(require(file));
    totals.added += stats.added;
    totals.errors.push(...stats.errors);
  }
  await ensureBuiltinBlueprints();
  return totals;
}

// ---------------------------------------------------------------------------
// Khung đề
// ---------------------------------------------------------------------------

async function ensureBuiltinBlueprints() {
  for (const bp of generator.BUILTIN_BLUEPRINTS) {
    if (await db.one('SELECT id FROM blueprints WHERE source_key = ?', [bp.key])) continue;
    const { structure } = generator.normalizeStructure(bp.structure);
    await db.query(
      'INSERT INTO blueprints (name, kind, duration_min, structure_json, source_note, source_key) VALUES (?, ?, ?, ?, ?, ?)',
      [bp.name, bp.kind, bp.duration, JSON.stringify(structure), bp.note, bp.key]
    );
  }
  // Khung đề theo đúng đề TN THPT 2026 (lấy từ ngân hàng mã đề 0230 nếu đã nạp)
  if (!(await db.one("SELECT id FROM blueprints WHERE source_key = 'bp-tn2026'"))) {
    const rows = await db.query("SELECT * FROM bank_questions WHERE source_key LIKE 'tn2026-0230-%' ORDER BY source_key");
    if (rows.length >= 28) {
      const items = rows.map((r) => {
        const [, , part] = r.source_key.split('-');
        return { part: Number(part), type: r.type, topic: r.topic, difficulty: r.difficulty, points: { mcq: 0.25, tf: 1, short: 0.25 }[r.type] };
      });
      const structure = generator.structureFromItems(items);
      await db.query(
        'INSERT INTO blueprints (name, kind, duration_min, structure_json, source_note, source_key) VALUES (?, ?, ?, ?, ?, ?)',
        ['Đề TN THPT 2026 môn Vật lí (theo đề chính thức)', 'exam', 50, JSON.stringify(structure),
          'Cùng cấu trúc, phân bố chủ đề và mức độ với đề thi tốt nghiệp THPT 2026 (mã đề 0230).', 'bp-tn2026']
      );
    }
  }
}

function blueprintFromRow(row) {
  return { ...row, structure: JSON.parse(row.structure_json) };
}

async function getBlueprint(id) {
  const row = await db.one('SELECT * FROM blueprints WHERE id = ?', [id]);
  return row ? blueprintFromRow(row) : null;
}

// ---------------------------------------------------------------------------
// Đề
// ---------------------------------------------------------------------------

async function createExam(meta, items, userId) {
  return withTransaction(async (q) => {
    const result = await q(
      `INSERT INTO exams (title, kind, description, duration_min, blueprint_id, auto_generated, is_personal, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [meta.title, meta.kind || 'test', meta.description || null, meta.durationMin || null, meta.blueprintId || null,
        meta.autoGenerated ? 1 : 0, meta.isPersonal ? 1 : 0, userId || null]
    );
    const examId = result.insertId;
    for (const [i, it] of items.entries()) await insertExamItem(q, examId, i + 1, it);
    if (!meta.isPersonal) await logEdit('exam', examId, 'create', { items: items.length, seed: meta.seed }, userId, q);
    return examId;
  });
}

async function insertExamItem(q, examId, position, it) {
  await q(
    `INSERT INTO exam_items (exam_id, position, part, points, bank_question_id, type, topic, difficulty, context_md, stem_md, data_json, explanation_md)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [examId, position, it.part || 1, it.points, it.bankQuestionId || null, it.type, it.topic, it.difficulty,
      it.context || null, it.stem, JSON.stringify(it.data), it.explanation || null]
  );
}

function itemFromRow(row) {
  return {
    id: row.id,
    examId: row.exam_id,
    position: row.position,
    part: row.part,
    points: Number(row.points),
    bankQuestionId: row.bank_question_id,
    type: row.type,
    topic: row.topic,
    difficulty: row.difficulty,
    context: row.context_md,
    stem: row.stem_md,
    data: JSON.parse(row.data_json),
    explanation: row.explanation_md,
  };
}

async function getExamItems(examId) {
  const rows = await db.query('SELECT * FROM exam_items WHERE exam_id = ? ORDER BY position, id', [examId]);
  return rows.map(itemFromRow);
}

async function renumberExam(examId, q = db.query) {
  const rows = await q('SELECT id FROM exam_items WHERE exam_id = ? ORDER BY part, position, id', [examId]);
  for (const [i, r] of rows.entries()) await q('UPDATE exam_items SET position = ? WHERE id = ?', [i + 1, r.id]);
}

function canManageExam(user, exam) {
  return Boolean(exam && (isAdmin(user) || exam.created_by === user.id));
}

async function examHasAttempts(examId) {
  const row = await db.one(
    `SELECT COUNT(*) AS n FROM attempts t JOIN assignments a ON a.id = t.assignment_id WHERE a.exam_id = ?`,
    [examId]
  );
  return row.n > 0;
}

// Sinh đề từ khung đề và lưu lại. Trả về { examId, warnings }.
async function generateExam({ blueprint, title, kind, durationMin, topics, grades, description, isPersonal, avoidIds, userId }) {
  const types = [...new Set(blueprint.structure.parts.map((p) => p.type))];
  const pool = await loadBank(types);
  const { items, warnings, seed } = generator.generate(blueprint.structure, pool, { topics, grades, avoidIds });
  if (!items.length) {
    throw new LmsError('Ngân hàng chưa có câu hỏi phù hợp với khung đề và chủ đề đã chọn. Hãy thêm câu hỏi hoặc chọn chủ đề khác.');
  }
  const examId = await createExam(
    { title, kind: kind || blueprint.kind, description, durationMin: durationMin ?? blueprint.duration_min, blueprintId: blueprint.id, autoGenerated: true, isPersonal, seed },
    items,
    userId
  );
  return { examId, warnings, count: items.length };
}

// Chấm lại một câu trong đề cho mọi bài đã nộp (khi giáo viên sửa đáp án). Giữ điểm chỉnh tay.
async function regradeExamItem(itemId, userId) {
  const row = await db.one('SELECT * FROM exam_items WHERE id = ?', [itemId]);
  if (!row) return 0;
  const item = itemFromRow(row);
  const rows = await db.query(
    `SELECT ai.*, t.id AS attempt_id FROM attempt_items ai JOIN attempts t ON t.id = ai.attempt_id
      WHERE ai.exam_item_id = ? AND t.status = 'submitted'`,
    [itemId]
  );
  const touched = new Set();
  for (const r of rows) {
    const response = r.response_json ? JSON.parse(r.response_json) : null;
    const g = gradeItem(item, response);
    if (Number(r.auto_points) !== g.points || Number(r.max_points) !== item.points) {
      await db.query('UPDATE attempt_items SET auto_points = ?, max_points = ?, correct_parts = ?, total_parts = ? WHERE id = ?', [
        g.points, item.points, g.correctParts, g.totalParts, r.id,
      ]);
      await db.query('INSERT INTO grade_audit (attempt_id, attempt_item_id, changed_by, old_points, new_points, reason) VALUES (?, ?, ?, ?, ?, ?)', [
        r.attempt_id, r.id, userId || null, r.auto_points, g.points, `Chấm lại tự động do sửa câu ${item.position}`,
      ]);
      touched.add(r.attempt_id);
    }
  }
  for (const attemptId of touched) await recomputeAttempt(attemptId);
  return touched.size;
}

// ---------------------------------------------------------------------------
// Lớp học
// ---------------------------------------------------------------------------

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

async function newClassCode() {
  for (let i = 0; i < 20; i += 1) {
    const bytes = crypto.randomBytes(6);
    const code = [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    if (!(await db.one('SELECT id FROM classes WHERE code = ?', [code]))) return code;
  }
  throw new LmsError('Không tạo được mã lớp, hãy thử lại.');
}

async function classesFor(user) {
  const where = isAdmin(user) ? '1=1' : 'c.teacher_id = ?';
  return db.query(
    `SELECT c.*, u.name AS teacher_name,
            (SELECT COUNT(*) FROM class_members m WHERE m.class_id = c.id) AS member_count,
            (SELECT COUNT(*) FROM assignments a WHERE a.class_id = c.id) AS assignment_count
       FROM classes c JOIN users u ON u.id = c.teacher_id
      WHERE ${where} ORDER BY c.archived, c.created_at DESC`,
    isAdmin(user) ? [] : [user.id]
  );
}

function canManageClass(user, cls) {
  return Boolean(cls && (isAdmin(user) || cls.teacher_id === user.id));
}

// Học viên mà giáo viên được xem: thành viên các lớp mình dạy hoặc được mình giao bài riêng.
async function canViewStudent(user, studentId) {
  if (isAdmin(user)) return true;
  const row = await db.one(
    `SELECT 1 AS ok FROM class_members m JOIN classes c ON c.id = m.class_id WHERE m.user_id = ? AND c.teacher_id = ?
     UNION SELECT 1 FROM assignment_targets t JOIN assignments a ON a.id = t.assignment_id WHERE t.user_id = ? AND a.created_by = ?
     LIMIT 1`,
    [studentId, user.id, studentId, user.id]
  );
  return Boolean(row);
}

async function studentsFor(user) {
  if (isAdmin(user)) return db.query("SELECT id, name, email FROM users WHERE role = 'student' ORDER BY name");
  return db.query(
    `SELECT DISTINCT u.id, u.name, u.email FROM users u
       JOIN class_members m ON m.user_id = u.id JOIN classes c ON c.id = m.class_id
      WHERE c.teacher_id = ? ORDER BY u.name`,
    [user.id]
  );
}

// ---------------------------------------------------------------------------
// Bài giao
// ---------------------------------------------------------------------------

async function getAssignment(id) {
  return db.one(
    `SELECT a.*, e.title AS exam_title, e.kind AS exam_kind, e.duration_min AS exam_duration, e.created_by AS exam_owner,
            c.name AS class_name, c.teacher_id AS class_teacher_id
       FROM assignments a JOIN exams e ON e.id = a.exam_id LEFT JOIN classes c ON c.id = a.class_id
      WHERE a.id = ?`,
    [id]
  );
}

function canManageAssignment(user, a) {
  return Boolean(a && (isAdmin(user) || a.created_by === user.id || a.class_teacher_id === user.id));
}

// Danh sách học viên được giao: nếu có giao riêng thì chỉ những người đó, ngược lại là cả lớp.
async function assignmentTargets(assignment) {
  const direct = await db.query(
    'SELECT u.id, u.name, u.email FROM assignment_targets t JOIN users u ON u.id = t.user_id WHERE t.assignment_id = ? ORDER BY u.name',
    [assignment.id]
  );
  if (direct.length || !assignment.class_id) return direct;
  return db.query(
    'SELECT u.id, u.name, u.email FROM class_members m JOIN users u ON u.id = m.user_id WHERE m.class_id = ? ORDER BY u.name',
    [assignment.class_id]
  );
}

async function isTarget(assignment, userId) {
  const direct = await db.query('SELECT user_id FROM assignment_targets WHERE assignment_id = ?', [assignment.id]);
  if (direct.length) return direct.some((r) => r.user_id === userId);
  if (!assignment.class_id) return false;
  return Boolean(await db.one('SELECT 1 AS ok FROM class_members WHERE class_id = ? AND user_id = ?', [assignment.class_id, userId]));
}

// Mọi bài được giao cho học viên (qua lớp hoặc giao riêng), kèm trạng thái làm bài.
async function assignmentsForStudent(userId) {
  const rows = await db.query(
    `SELECT a.*, e.title AS exam_title, e.kind AS exam_kind, e.duration_min AS exam_duration, c.name AS class_name
       FROM assignments a JOIN exams e ON e.id = a.exam_id LEFT JOIN classes c ON c.id = a.class_id
      WHERE a.id IN (SELECT assignment_id FROM assignment_targets WHERE user_id = ?)
         OR (a.class_id IN (SELECT class_id FROM class_members WHERE user_id = ?)
             AND NOT EXISTS (SELECT 1 FROM assignment_targets t WHERE t.assignment_id = a.id))
      ORDER BY COALESCE(a.due_at, a.created_at) DESC`,
    [userId, userId]
  );
  if (!rows.length) return [];
  const attempts = await db.query(
    `SELECT id, assignment_id, status, score, max_score, is_late, submitted_at, started_at FROM attempts
      WHERE user_id = ? AND assignment_id IN (?) ORDER BY id`,
    [userId, rows.map((r) => r.id)]
  );
  return rows.map((a) => ({ ...a, ...summarizeAttempts(a, attempts.filter((t) => t.assignment_id === a.id)) }));
}

// Điểm được tính theo chính sách (cao nhất / lần cuối) + trạng thái
function summarizeAttempts(assignment, attempts) {
  const submitted = attempts.filter((t) => t.status === 'submitted');
  const inProgress = attempts.find((t) => t.status === 'in_progress') || null;
  let counted = null;
  if (submitted.length) {
    counted = assignment.score_policy === 'last'
      ? submitted[submitted.length - 1]
      : submitted.reduce((best, t) => (Number(t.score) / Number(t.max_score) > Number(best.score) / Number(best.max_score) ? t : best));
  }
  const now = Date.now();
  let status = 'todo';
  if (counted) status = counted.is_late ? 'late' : 'done';
  else if (inProgress) status = 'doing';
  else if (assignment.open_at && new Date(assignment.open_at).getTime() > now) status = 'upcoming';
  else if (assignment.due_at && new Date(assignment.due_at).getTime() < now) status = 'overdue';
  const maxAttempts = Number(assignment.max_attempts);
  return {
    attemptsUsed: submitted.length,
    attemptsLeft: maxAttempts > 0 ? Math.max(0, maxAttempts - submitted.length) : Infinity,
    inProgress,
    counted,
    status,
    score10: counted ? roundPoints((Number(counted.score) / Number(counted.max_score)) * 10) : null,
  };
}

const STATUS_LABELS = {
  todo: 'Chưa làm',
  doing: 'Đang làm',
  done: 'Đã nộp',
  late: 'Nộp trễ',
  upcoming: 'Chưa mở',
  overdue: 'Quá hạn, chưa nộp',
};

// ---------------------------------------------------------------------------
// Làm bài
// ---------------------------------------------------------------------------

async function startAttempt(assignment, userId) {
  const now = new Date();
  if (assignment.open_at && new Date(assignment.open_at) > now) throw new LmsError('Bài này chưa đến giờ mở.');
  const attempts = await db.query('SELECT id, status FROM attempts WHERE assignment_id = ? AND user_id = ? ORDER BY id', [assignment.id, userId]);
  const open = attempts.find((t) => t.status === 'in_progress');
  if (open) return open.id;
  const used = attempts.filter((t) => t.status === 'submitted').length;
  if (Number(assignment.max_attempts) > 0 && used >= Number(assignment.max_attempts)) {
    throw new LmsError('Bạn đã dùng hết số lần làm bài cho phép.');
  }
  const duration = assignment.duration_min || assignment.exam_duration || null;
  const deadline = duration ? new Date(now.getTime() + duration * 60000) : null;
  const result = await db.query(
    'INSERT INTO attempts (assignment_id, user_id, started_at, deadline_at, status, answers_json) VALUES (?, ?, ?, ?, ?, ?)',
    [assignment.id, userId, now, deadline, 'in_progress', '{}']
  );
  return result.insertId;
}

// Chuẩn hoá câu trả lời gửi lên từ trình duyệt theo đúng dạng câu, bỏ qua câu không có trong đề.
function sanitizeAnswers(items, raw) {
  const answers = {};
  const source = raw && typeof raw === 'object' ? raw : {};
  for (const item of items) {
    const v = source[item.id];
    if (v === undefined || v === null || v === '') continue;
    if (item.type === 'mcq') {
      const n = Number(v);
      if (Number.isInteger(n) && n >= 0 && n < item.data.options.length) answers[item.id] = n;
    } else if (item.type === 'tf') {
      const arr = Array.isArray(v) ? v : [];
      const clean = [0, 1, 2, 3].map((i) => (arr[i] === true || arr[i] === 'true' ? true : arr[i] === false || arr[i] === 'false' ? false : null));
      if (clean.some((x) => x !== null)) answers[item.id] = clean;
    } else if (item.type === 'short') {
      const s = String(v).trim().slice(0, 30);
      if (s) answers[item.id] = s;
    }
  }
  return answers;
}

async function saveAnswers(attempt, items, raw) {
  const answers = sanitizeAnswers(items, raw);
  await db.query("UPDATE attempts SET answers_json = ? WHERE id = ? AND status = 'in_progress'", [JSON.stringify(answers), attempt.id]);
  return answers;
}

const LATE_GRACE_MS = 60 * 1000;

async function submitAttempt(attempt, assignment, items, raw) {
  const answers = raw ? sanitizeAnswers(items, raw) : JSON.parse(attempt.answers_json || '{}');
  const now = new Date();
  const late = (attempt.deadline_at && now.getTime() > new Date(attempt.deadline_at).getTime() + LATE_GRACE_MS)
    || (assignment.due_at && now > new Date(assignment.due_at));

  const results = items.map((item) => {
    const response = answers[item.id] ?? null;
    const g = gradeItem(item, response);
    return { item, response, points: g.points, maxPoints: item.points, correctParts: g.correctParts, totalParts: g.totalParts };
  });
  const usedSec = Math.round((now - new Date(attempt.started_at)) / 1000);
  const durationMin = assignment.duration_min || assignment.exam_duration;
  const analysis = analyzeAttempt(items, results, { usedSec, durationSec: durationMin ? durationMin * 60 : null, isLate: Boolean(late) });

  const changed = await withTransaction(async (q) => {
    const res = await q(
      `UPDATE attempts SET status = 'submitted', submitted_at = ?, is_late = ?, answers_json = ?, score = ?, max_score = ?, analysis_json = ?
        WHERE id = ? AND status = 'in_progress'`,
      [now, late ? 1 : 0, JSON.stringify(answers), analysis.score, analysis.maxScore, JSON.stringify(analysis), attempt.id]
    );
    if (res.affectedRows === 0) return false;
    for (const r of results) {
      await q(
        `INSERT INTO attempt_items (attempt_id, exam_item_id, response_json, auto_points, max_points, correct_parts, total_parts)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [attempt.id, r.item.id, r.response === null ? null : JSON.stringify(r.response), r.points, r.maxPoints, r.correctParts, r.totalParts]
      );
    }
    return true;
  });
  if (!changed) return { alreadySubmitted: true };

  // Tự giao bài luyện tập theo điểm yếu
  if (assignment.auto_practice && !assignment.is_auto_practice && analysis.practicePlan.length) {
    try {
      const practice = await createPractice(attempt.user_id, analysis.practicePlan, { sourceAttemptId: attempt.id });
      if (practice) {
        analysis.autoPractice = practice;
        await db.query('UPDATE attempts SET analysis_json = ? WHERE id = ?', [JSON.stringify(analysis), attempt.id]);
      }
    } catch (err) {
      console.error('Không tạo được bài luyện tập tự động:', err.message);
    }
  }
  return { analysis };
}

// Tính lại tổng điểm + phân tích sau khi chấm lại/chỉnh điểm
async function recomputeAttempt(attemptId) {
  const attempt = await db.one('SELECT * FROM attempts WHERE id = ?', [attemptId]);
  if (!attempt || attempt.status !== 'submitted') return;
  const assignment = await getAssignment(attempt.assignment_id);
  const items = await getExamItems(assignment.exam_id);
  const rows = await db.query('SELECT * FROM attempt_items WHERE attempt_id = ?', [attemptId]);
  const byItem = new Map(rows.map((r) => [r.exam_item_id, r]));
  const present = items.filter((it) => byItem.has(it.id));
  const results = present.map((item) => {
    const r = byItem.get(item.id);
    const points = r.override_points !== null ? Number(r.override_points) : Number(r.auto_points);
    return { response: r.response_json ? JSON.parse(r.response_json) : null, points, maxPoints: Number(r.max_points), correctParts: r.correct_parts, totalParts: r.total_parts };
  });
  const old = attempt.analysis_json ? JSON.parse(attempt.analysis_json) : {};
  const analysis = analyzeAttempt(present, results, old.timing || {});
  if (old.autoPractice) analysis.autoPractice = old.autoPractice;
  const adjusted = rows.some((r) => r.override_points !== null) ? 1 : 0;
  await db.query('UPDATE attempts SET score = ?, max_score = ?, analysis_json = ?, adjusted = ? WHERE id = ?', [
    analysis.score, analysis.maxScore, JSON.stringify(analysis), adjusted, attemptId,
  ]);
}

async function overrideItemPoints(attemptItemId, points, reason, userId) {
  const row = await db.one('SELECT * FROM attempt_items WHERE id = ?', [attemptItemId]);
  if (!row) throw new LmsError('Không tìm thấy câu trả lời.', 404);
  const max = Number(row.max_points);
  let value = points === null ? null : roundPoints(Number(points));
  if (value !== null && (!Number.isFinite(value) || value < 0 || value > max)) {
    throw new LmsError(`Điểm phải trong khoảng 0 – ${String(max).replace('.', ',')}.`);
  }
  const old = row.override_points !== null ? Number(row.override_points) : Number(row.auto_points);
  if (value !== null && value === Number(row.auto_points) && row.override_points === null) value = null;
  await db.query('UPDATE attempt_items SET override_points = ? WHERE id = ?', [value, attemptItemId]);
  await db.query('INSERT INTO grade_audit (attempt_id, attempt_item_id, changed_by, old_points, new_points, reason) VALUES (?, ?, ?, ?, ?, ?)', [
    row.attempt_id, attemptItemId, userId, old, value === null ? Number(row.auto_points) : value, reason || null,
  ]);
  await recomputeAttempt(row.attempt_id);
  return row.attempt_id;
}

// ---------------------------------------------------------------------------
// Luyện tập cá nhân hoá
// ---------------------------------------------------------------------------

// Năng lực theo chủ đề từ các bài đã nộp gần đây
async function topicMastery(userId, limit = 30) {
  const rows = await db.query(
    "SELECT analysis_json FROM attempts WHERE user_id = ? AND status = 'submitted' AND analysis_json IS NOT NULL ORDER BY submitted_at DESC LIMIT ?",
    [userId, limit]
  );
  return mergeTopicStats(rows.map((r) => JSON.parse(r.analysis_json)));
}

// plan: [{ topic, difficulty }] — tối đa 3 chủ đề, mỗi chủ đề 3 câu nhiều lựa chọn + 1 đúng/sai + 1 trả lời ngắn.
async function createPractice(userId, plan, { sourceAttemptId = null, createdBy = null, perTopic = 5, title = null } = {}) {
  const chosen = plan.slice(0, 3);
  if (!chosen.length) return null;
  const mcqCount = Math.max(1, perTopic - 2);
  const parts = [
    { type: 'mcq', points: 1, slots: chosen.map((p) => ({ topic: p.topic, difficulty: p.difficulty, count: mcqCount })) },
    { type: 'tf', points: 2, slots: chosen.map((p) => ({ topic: p.topic, difficulty: Math.max(2, p.difficulty), count: 1 })) },
    { type: 'short', points: 1, slots: chosen.map((p) => ({ topic: p.topic, difficulty: Math.max(2, p.difficulty), count: 1 })) },
  ];
  const seen = await db.query(
    `SELECT DISTINCT ei.bank_question_id AS id FROM attempts t JOIN assignments a ON a.id = t.assignment_id
       JOIN exam_items ei ON ei.exam_id = a.exam_id WHERE t.user_id = ? AND ei.bank_question_id IS NOT NULL`,
    [userId]
  );
  const pool = await loadBank();
  // Chỉ lấy câu đúng chủ đề cần luyện; thiếu thì bỏ qua thay vì lấy chủ đề khác.
  const topics = chosen.map((p) => p.topic);
  const filtered = pool.filter((q) => topics.includes(q.topic));
  const { structure } = generator.normalizeStructure({ parts });
  const { items } = generator.generate(structure, filtered, { topics, avoidIds: seen.map((r) => r.id) });
  if (items.length < 2) return null;
  const name = title || `Luyện tập: ${chosen.map((p) => getTopic(p.topic).name).join(', ')}`;
  const examId = await createExam({ title: name, kind: 'practice', autoGenerated: true, isPersonal: true }, items, createdBy);
  const result = await db.query(
    `INSERT INTO assignments (exam_id, class_id, title, instructions, max_attempts, score_policy, show_answers, auto_practice, is_auto_practice, source_attempt_id, created_by)
     VALUES (?, NULL, ?, ?, 0, 'best', 'after_submit', 0, 1, ?, ?)`,
    [examId, name, 'Bài luyện tập được tạo tự động theo kết quả của bạn. Làm không giới hạn số lần, không tính giờ.', sourceAttemptId, createdBy]
  );
  await db.query('INSERT INTO assignment_targets (assignment_id, user_id) VALUES (?, ?)', [result.insertId, userId]);
  return { assignmentId: result.insertId, title: name, questions: items.length };
}

function planFromMastery(mastery, topics) {
  return topics.map((topic) => {
    const m = mastery.find((x) => x.key === topic);
    return { topic, difficulty: m ? nextDifficulty(m.pct / 100) : 2 };
  });
}

module.exports = {
  LmsError,
  isAdmin,
  isStaff,
  withTransaction,
  logEdit,
  editHistory,
  loadBank,
  getBankQuestion,
  saveBankQuestion,
  importBank,
  importLessonQuestions,
  bankFiles,
  seedBank,
  ensureBuiltinBlueprints,
  blueprintFromRow,
  getBlueprint,
  createExam,
  insertExamItem,
  itemFromRow,
  getExamItems,
  renumberExam,
  canManageExam,
  examHasAttempts,
  generateExam,
  regradeExamItem,
  newClassCode,
  classesFor,
  canManageClass,
  canViewStudent,
  studentsFor,
  getAssignment,
  canManageAssignment,
  assignmentTargets,
  isTarget,
  assignmentsForStudent,
  summarizeAttempts,
  STATUS_LABELS,
  startAttempt,
  sanitizeAnswers,
  saveAnswers,
  submitAttempt,
  recomputeAttempt,
  overrideItemPoints,
  topicMastery,
  createPractice,
  planFromMastery,
};
