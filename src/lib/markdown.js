const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

marked.setOptions({ gfm: true, breaks: false });

// Công thức LaTeX ($...$ và $$...$$) được tách ra trước khi chạy Markdown để
// marked không làm hỏng dấu gạch dưới/gạch chéo ngược, rồi trả lại nguyên văn
// cho KaTeX render ở trình duyệt.
const MATH_PATTERN = /\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]+?(?<!\s)\$/g;

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'figure', 'figcaption', 'del', 'sup', 'sub', 'details', 'summary']),
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    th: ['align'],
    td: ['align'],
    code: ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: {
    img: (tagName, attribs) => ({ tagName, attribs: { loading: 'lazy', ...attribs } }),
  },
};

function render(source, { inline = false } = {}) {
  if (!source) return '';
  const maths = [];
  const protectedSource = source.replace(MATH_PATTERN, (match) => {
    maths.push(match);
    return `@@MATH${maths.length - 1}@@`;
  });

  const html = inline ? marked.parseInline(protectedSource) : marked.parse(protectedSource);
  const clean = sanitizeHtml(html, SANITIZE_OPTIONS);
  return clean.replace(/@@MATH(\d+)@@/g, (_, i) => escapeHtml(maths[Number(i)]));
}

module.exports = { render, renderInline: (source) => render(source, { inline: true }) };
