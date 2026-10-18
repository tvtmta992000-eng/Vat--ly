// Chấm điểm tự động theo thang điểm đề tốt nghiệp THPT:
//   Trắc nghiệm nhiều lựa chọn: đúng được toàn bộ điểm câu.
//   Đúng/Sai 4 ý: đúng 1 ý 10%, 2 ý 25%, 3 ý 50%, 4 ý 100% điểm câu.
//   Trả lời ngắn: so sánh số sau khi làm tròn theo yêu cầu đề.

const TF_SCALE = [0, 0.1, 0.25, 0.5, 1];

// "0,13" | "0.13" | " 7,06 " | "-1,5" | "1.2e3" → số; chuỗi rỗng/không hợp lệ → null
function parseNumber(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function round(x, decimals) {
  const f = Math.pow(10, decimals);
  return Math.round(x * f) / f;
}

function roundPoints(x) {
  return Math.round(x * 100) / 100;
}

// item: { type, points, data } ; response: tuỳ dạng câu
// Trả về { points, correctParts, totalParts }
function gradeItem(item, response) {
  const max = Number(item.points);
  const data = item.data;
  if (item.type === 'mcq') {
    const chosen = response === null || response === undefined || response === '' ? null : Number(response);
    const ok = chosen === data.answer;
    return { points: ok ? max : 0, correctParts: ok ? 1 : 0, totalParts: 1 };
  }
  if (item.type === 'tf') {
    const answers = Array.isArray(response) ? response : [];
    let correct = 0;
    data.answers.forEach((expected, i) => {
      const given = answers[i];
      if (given === true || given === false) {
        if (given === expected) correct += 1;
      }
    });
    const scale = TF_SCALE[Math.min(correct, 4)] ?? 0;
    return { points: roundPoints(max * scale), correctParts: correct, totalParts: data.answers.length };
  }
  if (item.type === 'short') {
    const given = parseNumber(response);
    const decimals = Number.isInteger(data.decimals) ? data.decimals : 2;
    const target = round(Number(data.answer), decimals);
    const tolerance = 0.5 * Math.pow(10, -decimals) + 1e-9;
    const ok = given !== null && Math.abs(given - target) <= tolerance;
    return { points: ok ? max : 0, correctParts: ok ? 1 : 0, totalParts: 1 };
  }
  throw new Error(`Dạng câu không hỗ trợ: ${item.type}`);
}

module.exports = { gradeItem, parseNumber, round, roundPoints, TF_SCALE };
