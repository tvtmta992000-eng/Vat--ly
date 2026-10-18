// Đọc/ghi form soạn câu hỏi (dùng cho ngân hàng, câu trong đề và duyệt đề mẫu).
const { parseNumber } = require('./grading');
const { getTopic } = require('./topics');

// Dòng biến thể: "N0 = 8,6 ; 6 ; 9,5 ; 0,1" (mặc định ; nhỏ nhất ; lớn nhất ; bước)
// Dòng hằng số:  "lam = 2,5e-10"
function parseTemplateText(text, answer) {
  const lines = String(text || '').split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length && !String(answer || '').trim()) return { template: null, errors: [] };
  const errors = [];
  const vars = {};
  const constants = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)$/);
    if (!m) {
      errors.push(`Dòng biến không hợp lệ: "${line}"`);
      continue;
    }
    const nums = m[2].split(';').map((s) => parseNumber(s));
    if (nums.some((n) => n === null)) {
      errors.push(`Giá trị không phải số ở dòng "${line}"`);
      continue;
    }
    if (nums.length === 1) constants[m[1]] = nums[0];
    else if (nums.length === 4) {
      const [value, min, max, step] = nums;
      if (!(min <= value && value <= max && step > 0)) {
        errors.push(`Biến ${m[1]}: cần nhỏ nhất ≤ mặc định ≤ lớn nhất và bước > 0.`);
        continue;
      }
      const decimals = (String(m[2].split(';')[3]).trim().replace(',', '.').split('.')[1] || '').length;
      vars[m[1]] = { min, max, step, value, decimals: Math.max(decimals, (String(value).split('.')[1] || '').length) };
    } else errors.push(`Dòng "${line}" cần dạng: tên = mặc định ; nhỏ nhất ; lớn nhất ; bước`);
  }
  const expr = String(answer || '').trim();
  if (!expr) errors.push('Thiếu biểu thức tính đáp số.');
  if (!Object.keys(vars).length) errors.push('Cần ít nhất một biến có khoảng giá trị.');
  return { template: errors.length ? null : { vars, answer: expr, constants }, errors };
}

function templateToText(template) {
  if (!template) return { text: '', answer: '' };
  const fmt = (n) => String(n).replace('.', ',');
  const lines = Object.entries(template.vars || {}).map(([k, v]) => `${k} = ${fmt(v.value)} ; ${fmt(v.min)} ; ${fmt(v.max)} ; ${fmt(v.step)}`);
  for (const [k, v] of Object.entries(template.constants || {})) lines.push(`${k} = ${fmt(v)}`);
  return { text: lines.join('\n'), answer: template.answer || '' };
}

// body → đầu vào cho bank.normalizeQuestion. prefix dùng khi một form chứa nhiều câu (q3_stem…).
function readQuestionForm(body, prefix = '') {
  const f = (name) => body[`${prefix}${name}`];
  const type = String(f('type') || '');
  const topic = String(f('topic') || '');
  const input = {
    type,
    topic,
    grade: getTopic(topic).grade,
    difficulty: f('difficulty'),
    context: String(f('context') || '').trim() || null,
    stem: String(f('stem') || ''),
    explanation: String(f('explanation') || '').trim() || null,
    family: String(f('family') || '').trim() || null,
    source: String(f('source') || '').trim() || null,
    data: {},
    template: null,
  };
  const errors = [];
  if (type === 'mcq') {
    input.data.options = [0, 1, 2, 3].map((i) => String(f(`opt_${i}`) || '').trim());
    input.data.answer = f('answer') === undefined || f('answer') === '' ? null : Number(f('answer'));
  } else if (type === 'tf') {
    input.data.statements = [0, 1, 2, 3].map((i) => String(f(`st_${i}`) || '').trim());
    input.data.answers = [0, 1, 2, 3].map((i) => f(`tf_${i}`));
    if (input.data.answers.some((a) => a !== 'true' && a !== 'false')) errors.push('Chọn Đúng hoặc Sai cho cả 4 ý.');
    input.data.answers = input.data.answers.map((a) => a === 'true');
  } else if (type === 'short') {
    input.data.decimals = f('decimals');
    input.data.unit = String(f('unit') || '').trim();
    const answer = parseNumber(f('short_answer'));
    input.data.answer = answer;
    if (f('use_template') === '1') {
      const t = parseTemplateText(f('template_vars'), f('template_answer'));
      errors.push(...t.errors);
      input.template = t.template;
    } else if (answer === null) errors.push('Nhập đáp số (dạng số, dùng dấu phẩy cho phần thập phân).');
  }
  return { input, errors };
}

// Câu hỏi → giá trị hiển thị lại trên form
function formValues(q) {
  const t = templateToText(q.template);
  return {
    type: q.type,
    topic: q.topic,
    difficulty: q.difficulty,
    context: q.context || '',
    stem: q.stem || '',
    explanation: q.explanation || '',
    family: q.family || '',
    source: q.source || '',
    options: q.data?.options || ['', '', '', ''],
    answer: q.data?.answer ?? null,
    statements: q.data?.statements || ['', '', '', ''],
    answers: q.data?.answers || [null, null, null, null],
    decimals: q.data?.decimals ?? 2,
    unit: q.data?.unit || '',
    shortAnswer: q.type === 'short' && q.data?.answer !== null && q.data?.answer !== undefined ? String(q.data.answer).replace('.', ',') : '',
    useTemplate: Boolean(q.template),
    templateVars: t.text,
    templateAnswer: t.answer,
  };
}

module.exports = { parseTemplateText, templateToText, readQuestionForm, formValues };
