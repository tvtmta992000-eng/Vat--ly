// Câu hỏi ngân hàng: chuẩn hoá, kiểm tra hợp lệ và sinh biến thể số liệu.
// Câu có template: { vars: { ten: {min, max, step, value, decimals} }, answer: "biểu thức", constants: {...} }
// Văn bản dùng {{ten}} cho giá trị biến và {{ans}} cho đáp số (đã làm tròn).
const { evaluate } = require('./expr');
const { round } = require('./grading');
const { getTopic } = require('./topics');

const TYPES = ['mcq', 'tf', 'short'];
const PLACEHOLDER = /\\?\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

// Số → chuỗi kiểu Việt Nam, bỏ số 0 thừa: 0.35 → "0,35"; 14.5 → "14,5"; 25 → "25"
function displayNumber(value, maxDecimals = 3) {
  if (!Number.isFinite(value)) return '';
  let s = value.toFixed(maxDecimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('-', '−').replace('.', ',');
}

// Đáp số luôn hiển thị đúng số chữ số thập phân mà đề yêu cầu: 0.1 với 2 chữ số → "0,10"
function displayAnswer(value, decimals) {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(decimals).replace('-', '−').replace('.', ',');
}

// Trong công thức ($...$) dấu phẩy thập phân phải viết {,} để KaTeX không chèn khoảng trắng.
const MATH = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g;

function substitute(text, values) {
  if (!text) return text;
  const fill = (chunk, inMath) => chunk.replace(PLACEHOLDER, (match, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return match;
    const v = String(values[name]);
    return inMath ? v.replace(',', '{,}').replace('−', '-') : v;
  });
  const source = String(text);
  let out = '';
  let last = 0;
  for (const m of source.matchAll(MATH)) {
    out += fill(source.slice(last, m.index), false) + fill(m[0], true);
    last = m.index + m[0].length;
  }
  return out + fill(source.slice(last), false);
}

function computeAnswer(template, vars) {
  return evaluate(template.answer, { ...(template.constants || {}), ...vars });
}

// Chọn ngẫu nhiên một giá trị trong [min, max] theo bước nhảy step.
function pickValue(spec, rng) {
  const min = Number(spec.min);
  const max = Number(spec.max);
  const step = Number(spec.step) > 0 ? Number(spec.step) : 1;
  const count = Math.floor((max - min) / step + 1e-9);
  if (!(count >= 0)) return Number(spec.value ?? min);
  const k = Math.floor(rng() * (count + 1));
  const stepDecimals = (String(step).split('.')[1] || '').length;
  return Number((min + k * step).toFixed(Math.min(10, stepDecimals + 2)));
}

function defaultVars(template) {
  const vars = {};
  for (const [name, spec] of Object.entries(template.vars || {})) {
    vars[name] = Number(spec.value ?? spec.min);
  }
  return vars;
}

// Gắn giá trị biến vào câu hỏi → câu hỏi "cụ thể" (không còn template) để đưa vào đề.
// Thử lại vài lần nếu bộ số ngẫu nhiên làm biểu thức lỗi hoặc đáp số không dương khi mặc định dương.
function instantiate(question, { rng = Math.random, useDefault = false } = {}) {
  const template = question.template;
  if (!template || !template.answer) {
    return { ...question, template: null };
  }
  const defaults = defaultVars(template);
  const defaultAnswer = computeAnswer(template, defaults);
  let vars = defaults;
  let answer = defaultAnswer;
  if (!useDefault) {
    for (let tries = 0; tries < 20; tries += 1) {
      const candidate = {};
      for (const [name, spec] of Object.entries(template.vars || {})) candidate[name] = pickValue(spec, rng);
      try {
        const value = computeAnswer(template, candidate);
        if (defaultAnswer > 0 && value <= 0) continue;
        vars = candidate;
        answer = value;
        break;
      } catch {
        // thử bộ số khác
      }
    }
  }
  const decimals = Number.isInteger(question.data?.decimals) ? question.data.decimals : 2;
  const shown = {};
  for (const [name, spec] of Object.entries(template.vars || {})) {
    shown[name] = displayNumber(vars[name], Number.isInteger(spec.decimals) ? spec.decimals : 3);
  }
  shown.ans = displayAnswer(round(answer, decimals), decimals);
  return {
    ...question,
    context: substitute(question.context, shown),
    stem: substitute(question.stem, shown),
    explanation: substitute(question.explanation, shown),
    data: { ...question.data, answer: round(answer, decimals), decimals },
    template: null,
    variant: vars,
  };
}

// Chuẩn hoá và kiểm tra một câu hỏi (từ file nội dung, form quản trị hoặc đề mẫu).
// Trả về { question, errors } — errors là mảng thông báo tiếng Việt.
function normalizeQuestion(input) {
  const errors = [];
  const q = {
    type: TYPES.includes(input.type) ? input.type : null,
    grade: [10, 11, 12].includes(Number(input.grade)) ? Number(input.grade) : 12,
    topic: String(input.topic || '').trim(),
    difficulty: [1, 2, 3].includes(Number(input.difficulty)) ? Number(input.difficulty) : 2,
    context: input.context ? String(input.context).replace(/\\\{\{/g, '{{').trim() : null,
    stem: String(input.stem || '').replace(/\\\{\{/g, '{{').trim(),
    explanation: input.explanation ? String(input.explanation).replace(/\\\{\{/g, '{{').trim() : null,
    data: input.data || {},
    template: input.template || null,
    source: input.source ? String(input.source).slice(0, 200) : null,
    family: input.family ? String(input.family).slice(0, 80) : null,
  };
  if (!q.type) errors.push('Dạng câu không hợp lệ.');
  if (!q.stem) errors.push('Thiếu nội dung câu hỏi.');
  if (!q.topic) errors.push('Chưa chọn chủ đề.');
  else if (!getTopic(q.topic).lessons.length && !/^[a-z0-9-]{2,40}$/.test(q.topic)) errors.push('Chủ đề không hợp lệ.');

  if (q.type === 'mcq') {
    const options = (q.data.options || []).map((o) => String(o ?? '').trim());
    const answer = Number(q.data.answer);
    if (options.length < 2 || options.some((o) => !o)) errors.push('Câu trắc nghiệm cần ít nhất 2 lựa chọn, không để trống.');
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) errors.push('Chưa chọn đáp án đúng.');
    q.data = { options, answer };
  } else if (q.type === 'tf') {
    const statements = (q.data.statements || []).map((s) => String(s ?? '').trim());
    const answers = (q.data.answers || []).map((a) => a === true || a === 'true' || a === 'Đ' || a === 1 || a === '1');
    if (statements.length !== 4 || statements.some((s) => !s)) errors.push('Câu Đúng/Sai cần đủ 4 ý a, b, c, d.');
    if (answers.length !== statements.length) errors.push('Chưa đánh dấu đúng/sai cho đủ các ý.');
    q.data = { statements, answers };
  } else if (q.type === 'short') {
    const decimals = Number.parseInt(q.data.decimals, 10);
    q.data = {
      decimals: Number.isInteger(decimals) && decimals >= 0 && decimals <= 6 ? decimals : 2,
      unit: q.data.unit ? String(q.data.unit).slice(0, 30) : '',
      answer: q.data.answer === undefined || q.data.answer === null || q.data.answer === '' ? null : Number(q.data.answer),
    };
    if (q.template) {
      try {
        const vars = defaultVars(q.template);
        for (const name of Object.keys(vars)) {
          if (!Number.isFinite(vars[name])) throw new Error(`biến ${name} thiếu giá trị mặc định`);
        }
        q.data.answer = round(computeAnswer(q.template, vars), q.data.decimals);
      } catch (err) {
        errors.push(`Biểu thức đáp số lỗi: ${err.message}`);
      }
    } else if (!Number.isFinite(q.data.answer)) {
      errors.push('Câu trả lời ngắn cần đáp số là một số.');
    }
  }
  return { question: q, errors };
}

// Dòng DB → đối tượng câu hỏi
function fromRow(row) {
  return {
    id: row.id,
    type: row.type,
    grade: row.grade,
    topic: row.topic,
    difficulty: row.difficulty,
    context: row.context_md,
    stem: row.stem_md,
    data: JSON.parse(row.data_json),
    explanation: row.explanation_md,
    template: row.template_json ? JSON.parse(row.template_json) : null,
    source: row.source,
    sourceKey: row.source_key,
    family: row.family,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  };
}

function toRowValues(q) {
  return {
    type: q.type,
    grade: q.grade,
    topic: q.topic,
    difficulty: q.difficulty,
    context_md: q.context || null,
    stem_md: q.stem,
    data_json: JSON.stringify(q.data),
    explanation_md: q.explanation || null,
    template_json: q.template ? JSON.stringify(q.template) : null,
    source: q.source || null,
    family: q.family || null,
  };
}

module.exports = {
  TYPES,
  displayNumber,
  displayAnswer,
  substitute,
  instantiate,
  normalizeQuestion,
  fromRow,
  toRowValues,
  defaultVars,
};
