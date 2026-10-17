const test = require('node:test');
const assert = require('node:assert');
const { render, renderInline } = require('../src/lib/markdown');

test('giữ nguyên công thức inline và block', () => {
  const html = render('Chu kì $T = 2\\pi\\sqrt{\\frac{l}{g}}$ và\n\n$$v_{tb} = \\frac{s}{t}$$');
  assert.match(html, /\$T = 2\\pi\\sqrt\{\\frac\{l\}\{g\}\}\$/);
  assert.match(html, /\$\$v_\{tb\} = \\frac\{s\}\{t\}\$\$/);
});

test('không biến gạch dưới trong công thức thành chữ nghiêng', () => {
  const html = render('$a_1 + a_2$ và $b_1$');
  assert.ok(!html.includes('<em>'));
});

test('escape ký tự HTML bên trong công thức', () => {
  const html = render('$a < b$');
  assert.match(html, /\$a &lt; b\$/);
});

test('loại bỏ script độc hại', () => {
  const html = render('Xin chào <script>alert(1)</script><img src=x onerror=alert(1)>');
  assert.ok(!html.includes('<script'));
  assert.ok(!html.includes('onerror'));
});

test('render inline không bọc thẻ p', () => {
  assert.strictEqual(renderInline('**đậm**'), '<strong>đậm</strong>');
});
