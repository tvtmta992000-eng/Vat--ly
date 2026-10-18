const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const bank = require('../src/lib/bank');
const generator = require('../src/lib/generator');
const { analyzeAttempt, diagnose, itemStatistics } = require('../src/lib/analysis');
const { parseExamText, parseKey, ParseError } = require('../src/lib/exam-parser');
const { parseTemplateText } = require('../src/lib/question-form');
const { gradeItem } = require('../src/lib/grading');
const time = require('../src/lib/time');

const tn2026 = require('../content/ngan-hang/de-tn-2026.js');
const chuyenDe = require('../content/ngan-hang/chuyen-de-10-11-12.js');

test('mọi câu trong ngân hàng có sẵn đều hợp lệ và key không trùng', () => {
  const all = [...tn2026, ...chuyenDe];
  const keys = new Set();
  for (const q of all) {
    const { errors } = bank.normalizeQuestion(q);
    assert.deepStrictEqual(errors, [], q.key);
    assert.ok(!keys.has(q.key), `trùng key ${q.key}`);
    keys.add(q.key);
  }
});

test('đáp số mặc định của phần trả lời ngắn khớp đáp án đề TN 2026', () => {
  const expected = {
    'tn2026-0230-3-01': 0.12, 'tn2026-0230-3-02': 7.06, 'tn2026-0230-3-03': 11.8,
    'tn2026-0230-3-04': 10.6, 'tn2026-0230-3-05': 2.67, 'tn2026-0230-3-06': 0.13,
    'tn2026-0207-3-01': 11.6, 'tn2026-0207-3-02': 10.4, 'tn2026-0207-3-03': 0.11,
    'tn2026-0207-3-04': 6.19, 'tn2026-0207-3-05': 2.52, 'tn2026-0207-3-06': 0.16,
  };
  for (const [key, answer] of Object.entries(expected)) {
    const { question } = bank.normalizeQuestion(tn2026.find((q) => q.key === key));
    const c = bank.instantiate(question, { useDefault: true });
    assert.strictEqual(c.data.answer, answer, key);
    assert.ok(!/\{\{/.test(c.context + c.stem + c.explanation), `${key} còn placeholder`);
  }
});

test('biến thể số liệu: giá trị trong khoảng, đáp số tính lại, dấu phẩy trong công thức viết {,}', () => {
  const { question } = bank.normalizeQuestion(tn2026.find((q) => q.key === 'tn2026-0230-3-03'));
  const rng = generator.seededRng(42);
  for (let i = 0; i < 50; i += 1) {
    const c = bank.instantiate(question, { rng });
    assert.ok(c.variant.t1 >= 10 && c.variant.t1 <= 20);
    const expect = Math.round(((c.variant.t2 + 273) / (c.variant.t1 + 273) - 1) * 1000) / 10;
    assert.strictEqual(c.data.answer, expect);
  }
  assert.strictEqual(bank.substitute('$x = {{a}}$ và {{a}}', { a: '1,5' }), '$x = 1{,}5$ và 1,5');
});

test('sinh đề theo khung TN THPT: đủ 18–4–6 câu, đúng 10 điểm, không trùng họ câu', () => {
  const pool = [...tn2026, ...chuyenDe].map((q, i) => ({ ...bank.normalizeQuestion(q).question, id: i + 1 }));
  const bp = generator.BUILTIN_BLUEPRINTS.find((b) => b.key === 'bp-tn-chuan');
  const { structure } = generator.normalizeStructure(bp.structure);
  const { items, warnings } = generator.generate(structure, pool, { grades: [12], seed: 7 });
  assert.strictEqual(items.filter((i) => i.type === 'mcq').length, 18);
  assert.strictEqual(items.filter((i) => i.type === 'tf').length, 4);
  assert.strictEqual(items.filter((i) => i.type === 'short').length, 6);
  assert.strictEqual(Math.round(items.reduce((s, i) => s + i.points, 0) * 100) / 100, 10);
  assert.ok(items.every((i) => i.topic.startsWith('vl12')));
  const families = items.map((i) => pool.find((q) => q.id === i.bankQuestionId).family);
  assert.strictEqual(new Set(families).size, families.length);
  assert.ok(Array.isArray(warnings));
});

test('sinh đề báo thiếu khi ngân hàng không đủ câu', () => {
  const { structure } = generator.normalizeStructure({ parts: [{ type: 'tf', points: 1, slots: [{ topic: 'vl10-c1', count: 40 }] }] });
  const pool = chuyenDe.map((q, i) => ({ ...bank.normalizeQuestion(q).question, id: i + 1 }));
  const { items, warnings } = generator.generate(structure, pool, {});
  assert.ok(items.length < 40);
  assert.ok(warnings.some((w) => w.includes('đề thiếu')));
});

test('khung đề rút ra từ đề mẫu giữ thứ tự chủ đề và thang điểm', () => {
  const s = generator.structureFromItems([
    { part: 1, type: 'mcq', topic: 'vl12-c1', difficulty: 1, points: 0.25 },
    { part: 1, type: 'mcq', topic: 'vl12-c1', difficulty: 1, points: 0.25 },
    { part: 2, type: 'tf', topic: 'vl12-c2', difficulty: 2, points: 1 },
  ]);
  assert.strictEqual(s.parts.length, 2);
  assert.deepStrictEqual(s.parts[0].slots, [{ topic: 'vl12-c1', difficulty: 1, count: 2 }]);
  assert.deepStrictEqual(generator.summarize(s), { questions: 3, points: 1.5 });
});

test('đọc đề mẫu dạng văn bản: phần, câu, phương án, dữ kiện chung, đáp án', () => {
  const r = parseExamText(fs.readFileSync(path.join(__dirname, 'fixtures', 'de-mau.txt'), 'utf8'));
  assert.strictEqual(r.durationMin, 50);
  assert.strictEqual(r.questions.length, 6);
  assert.deepStrictEqual(r.questions.map((q) => q.type), ['mcq', 'mcq', 'mcq', 'mcq', 'tf', 'short']);
  assert.deepStrictEqual(r.questions[1].options, ['1 atm.', '2 atm.', '4 atm.', '6 atm.']);
  assert.deepStrictEqual(r.questions.slice(0, 4).map((q) => q.answer), [0, 2, 1, 2]);
  assert.ok(r.questions[2].context.includes('thanh kim loại'));
  assert.strictEqual(r.questions[2].context, r.questions[3].context);
  assert.deepStrictEqual(r.questions[4].answers, [true, false, true, false]);
  assert.strictEqual(r.questions[5].answer, 25);
  assert.strictEqual(r.questions[2].topic, 'vl12-c3');
  assert.strictEqual(r.keyFound, 6);
});

test('đọc đáp án nhiều kiểu viết', () => {
  const k = parseKey('1-A, 2.B 3: C\nCâu 4: D\nCâu 1: ĐĐSS\n2) Đúng Sai Đúng Sai\nCâu 1: 0,12\nCâu 2: -3.5');
  assert.deepStrictEqual(k.mcq.map((x) => x.answer), [0, 1, 2, 3]);
  assert.deepStrictEqual(k.tf[0].answers, [true, true, false, false]);
  assert.deepStrictEqual(k.tf[1].answers, [true, false, true, false]);
  assert.deepStrictEqual(k.short.map((x) => x.answer), [0.12, -3.5]);
});

test('đề ảnh chụp (gần như không có chữ) báo lỗi rõ ràng', () => {
  assert.throws(() => parseExamText('   \n  '), ParseError);
  assert.throws(() => parseExamText('Một đoạn văn bản dài nhưng không có câu hỏi nào được đánh số theo mẫu cả, chỉ là mô tả chung chung về đề thi.'), /Không tìm thấy câu hỏi/);
});

test('chẩn đoán lỗi câu trả lời ngắn: đơn vị, làm tròn, dấu', () => {
  const item = { type: 'short', data: { answer: 2.67, decimals: 2 } };
  const r = (resp) => ({ ...gradeItem({ ...item, points: 0.25 }, resp), maxPoints: 0.25, response: resp });
  assert.strictEqual(diagnose(item, r('2670')).kind, 'unit');
  assert.strictEqual(diagnose(item, r('2,7')).kind, 'rounding');
  assert.strictEqual(diagnose(item, r('-2,67')).kind, 'sign');
  assert.strictEqual(diagnose(item, r(null)).kind, 'blank');
  assert.strictEqual(diagnose(item, r('2,67')), null);
});

test('phân tích bài làm: điểm theo chủ đề, điểm mạnh/yếu, kế hoạch luyện tập', () => {
  const items = [
    { id: 1, position: 1, type: 'mcq', topic: 'vl12-c1', difficulty: 1, points: 1, data: { options: ['a', 'b', 'c', 'd'], answer: 0 } },
    { id: 2, position: 2, type: 'mcq', topic: 'vl12-c1', difficulty: 2, points: 1, data: { options: ['a', 'b', 'c', 'd'], answer: 1 } },
    { id: 3, position: 3, type: 'tf', topic: 'vl12-c2', difficulty: 2, points: 1, data: { statements: ['1', '2', '3', '4'], answers: [true, true, false, false] } },
  ];
  const responses = [0, 1, [true, true, true, true]];
  const results = items.map((it, i) => ({ ...gradeItem(it, responses[i]), maxPoints: it.points, response: responses[i] }));
  const a = analyzeAttempt(items, results, {});
  assert.strictEqual(a.score, 2.25);
  assert.deepStrictEqual(a.strengths, ['vl12-c1']);
  assert.deepStrictEqual(a.weaknesses, ['vl12-c2']);
  assert.ok(a.errors.some((e) => e.kind === 'tf-same'));
  assert.deepStrictEqual(a.practicePlan, [{ topic: 'vl12-c2', difficulty: 1 }]);
  assert.ok(a.methods.length > 0);
  const stats = itemStatistics(items, [
    { exam_item_id: 1, response: 2, points: 0, max_points: 1 },
    { exam_item_id: 1, response: 2, points: 0, max_points: 1 },
    { exam_item_id: 1, response: 0, points: 1, max_points: 1 },
  ]);
  assert.strictEqual(stats[0].fullRate, 33);
  assert.match(stats[0].note, /chọn nhầm C/);
});

test('mẫu biến thể nhập từ form', () => {
  const ok = parseTemplateText('t1 = 14,5 ; 10 ; 20 ; 0,1\nlam = 2,5e-10', '(t1+273)*lam');
  assert.deepStrictEqual(ok.errors, []);
  assert.strictEqual(ok.template.vars.t1.decimals, 1);
  assert.strictEqual(ok.template.constants.lam, 2.5e-10);
  assert.ok(parseTemplateText('x = 5 ; 10 ; 20 ; 1', 'x').errors.length);
});

test('giờ Việt Nam cho ô datetime-local', () => {
  const d = time.parseLocalInput('2026-10-20T08:00');
  assert.strictEqual(d.toISOString(), '2026-10-20T01:00:00.000Z');
  assert.strictEqual(time.toLocalInput(d), '2026-10-20T08:00');
  assert.strictEqual(time.formatDateTime(d), '20/10/2026 08:00');
  assert.strictEqual(time.parseLocalInput(''), null);
});
