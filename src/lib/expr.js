// Bộ tính biểu thức số học an toàn (không dùng eval) cho câu hỏi có biến thể số liệu.
// Hỗ trợ: + - * / ^, ngoặc, số thập phân (dùng dấu chấm), số dạng 1.6e-19,
// biến, hằng pi và e, các hàm sqrt, exp, ln, log10, sin, cos, tan, abs, round(x, n), min, max.
// Hàm lượng giác nhận góc theo độ (phù hợp đề Vật lí phổ thông).

const FUNCTIONS = {
  sqrt: Math.sqrt,
  exp: Math.exp,
  ln: Math.log,
  log10: Math.log10,
  abs: Math.abs,
  sin: (d) => Math.sin((d * Math.PI) / 180),
  cos: (d) => Math.cos((d * Math.PI) / 180),
  tan: (d) => Math.tan((d * Math.PI) / 180),
  round: (x, n = 0) => {
    const f = Math.pow(10, n);
    return Math.round(x * f) / f;
  },
  min: Math.min,
  max: Math.max,
};
const CONSTANTS = { pi: Math.PI, e: Math.E };

function tokenize(source) {
  const tokens = [];
  const s = String(source);
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/);
      if (!m) throw new Error(`Số không hợp lệ tại vị trí ${i}`);
      tokens.push({ type: 'num', value: parseFloat(m[0]) });
      i += m[0].length;
    } else if (/[A-Za-z_]/.test(ch)) {
      const m = s.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      tokens.push({ type: 'id', value: m[0] });
      i += m[0].length;
    } else if ('+-*/^(),'.includes(ch)) {
      tokens.push({ type: 'op', value: ch });
      i += 1;
    } else {
      throw new Error(`Ký tự không hợp lệ: "${ch}"`);
    }
  }
  return tokens;
}

// Phân tích cú pháp đệ quy: expr := term (('+'|'-') term)* ; term := unary (('*'|'/') unary)* ;
// unary := ('-'|'+') unary | power ; power := primary ('^' unary)?
function evaluate(source, vars = {}) {
  const tokens = tokenize(source);
  let pos = 0;
  const peek = () => tokens[pos];
  const take = () => tokens[pos++];
  const expectOp = (op) => {
    const t = take();
    if (!t || t.type !== 'op' || t.value !== op) throw new Error(`Thiếu "${op}"`);
  };

  function expr() {
    let value = term();
    while (peek() && peek().type === 'op' && (peek().value === '+' || peek().value === '-')) {
      const op = take().value;
      const rhs = term();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }
  function term() {
    let value = unary();
    while (peek() && peek().type === 'op' && (peek().value === '*' || peek().value === '/')) {
      const op = take().value;
      const rhs = unary();
      value = op === '*' ? value * rhs : value / rhs;
    }
    return value;
  }
  function unary() {
    const t = peek();
    if (t && t.type === 'op' && (t.value === '-' || t.value === '+')) {
      take();
      const v = unary();
      return t.value === '-' ? -v : v;
    }
    return power();
  }
  function power() {
    const base = primary();
    if (peek() && peek().type === 'op' && peek().value === '^') {
      take();
      return Math.pow(base, unary());
    }
    return base;
  }
  function primary() {
    const t = take();
    if (!t) throw new Error('Biểu thức bị cụt');
    if (t.type === 'num') return t.value;
    if (t.type === 'op' && t.value === '(') {
      const v = expr();
      expectOp(')');
      return v;
    }
    if (t.type === 'id') {
      if (peek() && peek().type === 'op' && peek().value === '(') {
        const fn = FUNCTIONS[t.value];
        if (!fn) throw new Error(`Hàm không được hỗ trợ: ${t.value}`);
        take();
        const args = [];
        if (!(peek() && peek().type === 'op' && peek().value === ')')) {
          args.push(expr());
          while (peek() && peek().type === 'op' && peek().value === ',') {
            take();
            args.push(expr());
          }
        }
        expectOp(')');
        return fn(...args);
      }
      if (Object.prototype.hasOwnProperty.call(vars, t.value)) return Number(vars[t.value]);
      if (Object.prototype.hasOwnProperty.call(CONSTANTS, t.value)) return CONSTANTS[t.value];
      throw new Error(`Biến chưa được định nghĩa: ${t.value}`);
    }
    throw new Error(`Ký hiệu không mong đợi: ${t.value}`);
  }

  const result = expr();
  if (pos < tokens.length) throw new Error(`Thừa ký hiệu: ${tokens[pos].value}`);
  if (!Number.isFinite(result)) throw new Error('Kết quả không phải số hữu hạn');
  return result;
}

// Định dạng số kiểu Việt Nam với số chữ số thập phân cố định: 0.1286 → "0,13"
function formatNumber(value, decimals) {
  if (!Number.isFinite(value)) return '';
  return value.toFixed(decimals).replace('.', ',');
}

module.exports = { evaluate, formatNumber };
