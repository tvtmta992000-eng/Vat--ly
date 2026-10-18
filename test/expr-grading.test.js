const test = require('node:test');
const assert = require('node:assert');
const { evaluate, formatNumber } = require('../src/lib/expr');
const { gradeItem, parseNumber } = require('../src/lib/grading');

test('evaluate: phép toán, luỹ thừa, hàm, biến', () => {
  assert.strictEqual(evaluate('2 + 3 * 4'), 14);
  assert.strictEqual(evaluate('2^3^2'), 512);
  assert.strictEqual(evaluate('-2^2'), -4);
  assert.ok(Math.abs(evaluate('B*l*v', { B: 0.35, l: 0.25, v: 0.55 }) - 0.048125) < 1e-12);
  assert.ok(Math.abs(evaluate('sin(30)') - 0.5) < 1e-12);
  assert.strictEqual(evaluate('round(3.14159, 2)'), 3.14);
  assert.ok(Math.abs(evaluate('N0*exp(-lam*t*365*86400)/1e24', { N0: 8.6e24, lam: 2.5e-10, t: 25 }) - 7.0615) < 1e-3);
});

test('evaluate: chặn biểu thức nguy hiểm hoặc sai', () => {
  assert.throws(() => evaluate('process.exit()'));
  assert.throws(() => evaluate('constructor'));
  assert.throws(() => evaluate('1 +'));
  assert.throws(() => evaluate('1/0'));
  assert.throws(() => evaluate('x', {}));
});

test('formatNumber dùng dấu phẩy', () => {
  assert.strictEqual(formatNumber(0.128667, 2), '0,13');
  assert.strictEqual(formatNumber(11.826, 1), '11,8');
});

test('parseNumber chấp nhận dấu phẩy và dấu chấm', () => {
  assert.strictEqual(parseNumber('0,13'), 0.13);
  assert.strictEqual(parseNumber(' 7.06 '), 7.06);
  assert.strictEqual(parseNumber('abc'), null);
  assert.strictEqual(parseNumber(''), null);
});

test('chấm trắc nghiệm', () => {
  const item = { type: 'mcq', points: 0.25, data: { answer: 2 } };
  assert.strictEqual(gradeItem(item, 2).points, 0.25);
  assert.strictEqual(gradeItem(item, '2').points, 0.25);
  assert.strictEqual(gradeItem(item, 1).points, 0);
  assert.strictEqual(gradeItem(item, null).points, 0);
});

test('chấm đúng/sai theo thang 0,1 / 0,25 / 0,5 / 1', () => {
  const item = { type: 'tf', points: 1, data: { answers: [true, true, false, false] } };
  assert.strictEqual(gradeItem(item, [true, true, false, false]).points, 1);
  assert.strictEqual(gradeItem(item, [true, true, false, true]).points, 0.5);
  assert.strictEqual(gradeItem(item, [true, true, true, true]).points, 0.25);
  assert.strictEqual(gradeItem(item, [true, false, true, true]).points, 0.1);
  assert.strictEqual(gradeItem(item, [false, false, true, true]).points, 0);
  assert.strictEqual(gradeItem(item, [true, null, null, null]).points, 0.1);
});

test('chấm trả lời ngắn có làm tròn', () => {
  const item = { type: 'short', points: 0.25, data: { answer: 0.128667, decimals: 2 } };
  assert.strictEqual(gradeItem(item, '0,13').points, 0.25);
  assert.strictEqual(gradeItem(item, '0.13').points, 0.25);
  assert.strictEqual(gradeItem(item, '0,1287').points, 0.25);
  assert.strictEqual(gradeItem(item, '0,12').points, 0);
  assert.strictEqual(gradeItem(item, '0,14').points, 0);
  assert.strictEqual(gradeItem(item, '').points, 0);
  const pct = { type: 'short', points: 0.25, data: { answer: 11.826, decimals: 1 } };
  assert.strictEqual(gradeItem(pct, '11,8').points, 0.25);
  assert.strictEqual(gradeItem(pct, '11,9').points, 0);
});
