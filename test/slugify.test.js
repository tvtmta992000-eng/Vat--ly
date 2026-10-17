const test = require('node:test');
const assert = require('node:assert');
const { slugify } = require('../src/lib/content');

test('slugify bỏ dấu tiếng Việt', () => {
  assert.strictEqual(slugify('Định luật Ohm cho toàn mạch'), 'dinh-luat-ohm-cho-toan-mach');
  assert.strictEqual(slugify('  Con lắc đơn!! '), 'con-lac-don');
});
