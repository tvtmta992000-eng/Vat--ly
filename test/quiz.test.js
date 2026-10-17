const test = require('node:test');
const assert = require('node:assert');
const { gradeQuiz, parseOptions } = require('../src/lib/quiz');

const questions = [
  { id: 1, correct_index: 0 },
  { id: 2, correct_index: 2 },
  { id: 3, correct_index: 1 },
];

test('chấm đúng số câu đúng', () => {
  const { score, total, results } = gradeQuiz(questions, { q1: '0', q2: '1', q3: '1' });
  assert.strictEqual(score, 2);
  assert.strictEqual(total, 3);
  assert.deepStrictEqual(results.map((r) => r.correct), [true, false, true]);
});

test('câu bỏ trống được tính sai và chosen = null', () => {
  const { score, results } = gradeQuiz(questions, {});
  assert.strictEqual(score, 0);
  assert.strictEqual(results[0].chosen, null);
});

test('parseOptions chịu được JSON hỏng', () => {
  assert.deepStrictEqual(parseOptions({ options_json: 'oops' }), []);
  assert.deepStrictEqual(parseOptions({ options_json: '["a","b"]' }), ['a', 'b']);
});
