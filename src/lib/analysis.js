// Phân tích kết quả bài làm (theo thống kê và quy tắc, không cần AI):
// điểm theo chủ đề/dạng câu/mức độ, điểm mạnh – yếu, lỗi thường gặp, nhận xét và gợi ý phương pháp học.
const { getTopic, DIFFICULTIES, TYPES } = require('./topics');
const { parseNumber, round, roundPoints } = require('./grading');

const STRONG = 0.8;
const WEAK = 0.5;
const LETTERS = 'ABCDEF';

function pct(earned, max) {
  return max > 0 ? earned / max : 0;
}

function group(results, keyFn, labelFn) {
  const map = new Map();
  for (const r of results) {
    const key = keyFn(r);
    if (!map.has(key)) map.set(key, { key, label: labelFn(key), earned: 0, max: 0, count: 0, correct: 0 });
    const g = map.get(key);
    g.earned += r.points;
    g.max += r.maxPoints;
    g.count += 1;
    if (r.points >= r.maxPoints - 1e-9) g.correct += 1;
  }
  return [...map.values()].map((g) => ({ ...g, earned: roundPoints(g.earned), pct: Math.round(pct(g.earned, g.max) * 100) }));
}

function isBlank(type, response) {
  if (type === 'tf') return !Array.isArray(response) || response.every((v) => v !== true && v !== false);
  return response === null || response === undefined || String(response).trim() === '';
}

// Chẩn đoán lỗi của một câu sai. Trả về { kind, message } hoặc null nếu đúng hoàn toàn.
function diagnose(item, result) {
  const { type, data } = item;
  const response = result.response;
  if (result.points >= result.maxPoints - 1e-9) return null;
  if (isBlank(type, response)) return { kind: 'blank', message: 'Bỏ trống, chưa trả lời.' };

  if (type === 'mcq') {
    return {
      kind: 'mcq-wrong',
      message: `Chọn ${LETTERS[Number(response)] || '?'}, đáp án đúng là ${LETTERS[data.answer]}.`,
    };
  }
  if (type === 'tf') {
    const wrong = data.answers
      .map((expected, i) => (response[i] === expected ? null : 'abcd'[i]))
      .filter(Boolean);
    const answered = response.filter((v) => v === true || v === false);
    if (answered.length === 4 && answered.every((v) => v === answered[0])) {
      return { kind: 'tf-same', message: `Chọn cùng một phương án "${answered[0] ? 'Đúng' : 'Sai'}" cho cả 4 ý — có dấu hiệu đoán.` };
    }
    return { kind: 'tf-partial', message: `Sai hoặc bỏ trống ý ${wrong.join(', ')}.` };
  }
  if (type === 'short') {
    const given = parseNumber(response);
    const answer = Number(data.answer);
    if (given === null) return { kind: 'format', message: 'Đáp số không phải là một số hợp lệ (dùng dấu phẩy cho phần thập phân).' };
    if (answer !== 0 && given !== 0) {
      if (Math.abs(given + answer) <= Math.abs(answer) * 0.02) return { kind: 'sign', message: 'Sai dấu của kết quả.' };
      const ratio = Math.log10(Math.abs(given / answer));
      const k = Math.round(ratio);
      if (k !== 0 && Math.abs(ratio - k) < 0.01) {
        return { kind: 'unit', message: `Kết quả lệch đúng 10${superscript(k)} lần — nhiều khả năng đổi đơn vị hoặc luỹ thừa chưa đúng.` };
      }
      if (Math.abs(given - answer) <= Math.abs(answer) * 0.03) {
        const decimals = Number.isInteger(data.decimals) ? data.decimals : 2;
        return { kind: 'rounding', message: `Kết quả gần đúng nhưng chưa làm tròn đúng yêu cầu (${decimals} chữ số thập phân: ${String(round(answer, decimals)).replace('.', ',')}).` };
      }
    }
    return { kind: 'calc', message: 'Kết quả sai — kiểm tra lại công thức và các bước tính.' };
  }
  return null;
}

function superscript(n) {
  const map = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  return String(n).split('').map((c) => map[c] || c).join('');
}

const ERROR_LABELS = {
  blank: 'Bỏ trống',
  'mcq-wrong': 'Chọn sai đáp án',
  'tf-partial': 'Sai một số ý đúng/sai',
  'tf-same': 'Chọn cùng một phương án cho cả 4 ý',
  format: 'Viết đáp số sai định dạng',
  sign: 'Sai dấu',
  unit: 'Sai đổi đơn vị / luỹ thừa',
  rounding: 'Làm tròn chưa đúng yêu cầu',
  calc: 'Tính toán sai',
};

function rank(score10) {
  if (score10 >= 8) return { label: 'Giỏi', tone: 'good' };
  if (score10 >= 6.5) return { label: 'Khá', tone: 'good' };
  if (score10 >= 5) return { label: 'Trung bình', tone: 'ok' };
  return { label: 'Cần cố gắng', tone: 'low' };
}

// Mức độ nên luyện tiếp theo theo tỉ lệ đạt của chủ đề
function nextDifficulty(ratio) {
  if (ratio < 0.4) return 1;
  if (ratio < 0.7) return 2;
  return 3;
}

// items: exam items { position, type, topic, difficulty, data, points }
// results: cùng thứ tự với items { points, maxPoints, correctParts, totalParts, response }
// timing: { usedSec, durationSec, isLate }
function analyzeAttempt(items, results, timing = {}) {
  const rows = items.map((item, i) => ({ item, ...results[i] }));
  const score = roundPoints(rows.reduce((s, r) => s + r.points, 0));
  const maxScore = roundPoints(rows.reduce((s, r) => s + r.maxPoints, 0));
  const ratio = pct(score, maxScore);
  const score10 = roundPoints(ratio * 10);

  const byTopic = group(rows, (r) => r.item.topic, (k) => getTopic(k).name).sort((a, b) => a.pct - b.pct);
  const byType = group(rows, (r) => r.item.type, (k) => TYPES[k]);
  const byDifficulty = group(rows, (r) => r.item.difficulty, (k) => DIFFICULTIES[k]).sort((a, b) => a.key - b.key);

  const strengths = byTopic.filter((g) => g.pct >= STRONG * 100).map((g) => g.key);
  const weaknesses = byTopic.filter((g) => g.pct < WEAK * 100).map((g) => g.key);
  const middle = byTopic.filter((g) => g.pct >= WEAK * 100 && g.pct < STRONG * 100).map((g) => g.key);

  const errors = [];
  for (const r of rows) {
    const d = diagnose(r.item, r);
    if (d) errors.push({ position: r.item.position, topic: r.item.topic, ...d });
  }
  const errorCounts = {};
  errors.forEach((e) => { errorCounts[e.kind] = (errorCounts[e.kind] || 0) + 1; });
  const errorSummary = Object.entries(errorCounts)
    .map(([kind, count]) => ({ kind, label: ERROR_LABELS[kind], count }))
    .sort((a, b) => b.count - a.count);

  // Nhận xét tổng quát
  const level = rank(score10);
  const feedback = [];
  feedback.push(`Bạn đạt ${String(score).replace('.', ',')}/${String(maxScore).replace('.', ',')} điểm (${Math.round(ratio * 100)}%) — xếp loại ${level.label.toLowerCase()}.`);
  if (strengths.length) feedback.push(`Nắm vững: ${strengths.map((k) => getTopic(k).name).join(', ')}.`);
  if (weaknesses.length) feedback.push(`Cần ôn lại: ${weaknesses.map((k) => getTopic(k).name).join(', ')}.`);
  else if (middle.length) feedback.push(`Có thể cải thiện thêm: ${middle.map((k) => getTopic(k).name).join(', ')}.`);

  // Gợi ý phương pháp học
  const methods = [];
  const diff = Object.fromEntries(byDifficulty.map((g) => [g.key, g]));
  if (diff[1] && diff[1].pct < 70) {
    methods.push('Phần nhận biết còn mất điểm: đọc lại phần lí thuyết trọng tâm, tự viết lại định nghĩa và công thức ra giấy (hoặc thẻ ghi nhớ) rồi tự kiểm tra lại sau 1–2 ngày.');
  }
  if (diff[3] && diff[3].pct < 50 && (!diff[1] || diff[1].pct >= 70)) {
    methods.push('Lí thuyết đã ổn nhưng câu vận dụng còn yếu: mỗi ngày giải 2–3 bài tính toán, viết đủ các bước (tóm tắt – đổi đơn vị – công thức – thay số) thay vì bấm máy ngay.');
  }
  if (errorCounts['tf-partial'] || errorCounts['tf-same']) {
    methods.push('Với câu Đúng/Sai: xét từng ý độc lập, gạch chân từ khoá ("luôn", "chỉ", "tỉ lệ thuận"…) và kiểm tra bằng công thức trước khi chọn.');
  }
  if (errorCounts.unit) methods.push('Đổi tất cả đại lượng về đơn vị SI trước khi thay số; chú ý các tiền tố m (10⁻³), μ (10⁻⁶), k (10³).');
  if (errorCounts.rounding) methods.push('Đọc kĩ yêu cầu làm tròn của câu trả lời ngắn; giữ nhiều chữ số ở các bước trung gian và chỉ làm tròn ở kết quả cuối.');
  if (errorCounts.sign) methods.push('Chọn chiều dương rõ ràng trước khi giải và giữ đúng dấu của các đại lượng vectơ.');
  if ((errorCounts.blank || 0) >= 2) {
    methods.push('Còn nhiều câu bỏ trống: phân bổ thời gian (khoảng 1 phút/câu nhiều lựa chọn), làm câu dễ trước; câu nhiều lựa chọn và đúng/sai không bị trừ điểm nên đừng bỏ trống.');
  }
  if (timing.durationSec && timing.usedSec && timing.usedSec < timing.durationSec * 0.3 && ratio < 0.5) {
    methods.push('Bạn làm bài khá nhanh nhưng điểm chưa cao: hãy đọc kĩ đề và soát lại đáp án trước khi nộp.');
  }
  if (timing.isLate) methods.push('Bài nộp quá thời gian quy định: luyện đề có bấm giờ để quen áp lực thời gian.');
  if (!methods.length && ratio >= 0.85) {
    methods.push('Kết quả rất tốt! Hãy thử sức với đề mức vận dụng cao hơn hoặc đề thi thử đầy đủ có bấm giờ.');
  }
  if (!methods.length) methods.push('Ôn lại các chủ đề được gợi ý bên dưới rồi làm bài luyện tập để củng cố.');

  // Gợi ý ôn tập theo chủ đề yếu (kèm bài học, mô phỏng)
  const review = [...weaknesses, ...middle].slice(0, 4).map((k) => {
    const t = getTopic(k);
    return { topic: k, name: t.name, tip: t.tip, lessons: t.lessons, simulation: t.simulation || null };
  });

  const practicePlan = byTopic
    .filter((g) => g.pct < STRONG * 100)
    .map((g) => ({ topic: g.key, difficulty: nextDifficulty(g.pct / 100) }));

  return {
    score,
    maxScore,
    score10,
    percent: Math.round(ratio * 100),
    level,
    byTopic,
    byType,
    byDifficulty,
    strengths,
    weaknesses,
    errors,
    errorSummary,
    feedback,
    methods,
    review,
    practicePlan,
    timing,
  };
}

// Thống kê theo câu cho cả lớp: tỉ lệ đúng, phương án nhiễu được chọn nhiều, đáp số sai phổ biến.
// rows: [{ exam_item_id, response, points, max_points }]
function itemStatistics(items, rows) {
  const byItem = new Map(items.map((it) => [it.id, { item: it, n: 0, full: 0, earned: 0, max: 0, choices: {}, statements: [0, 0, 0, 0], wrongValues: {}, blank: 0 }]));
  for (const r of rows) {
    const s = byItem.get(r.exam_item_id);
    if (!s) continue;
    s.n += 1;
    s.earned += Number(r.points);
    s.max += Number(r.max_points);
    if (Number(r.points) >= Number(r.max_points) - 1e-9) s.full += 1;
    const type = s.item.type;
    if (isBlank(type, r.response)) {
      s.blank += 1;
      continue;
    }
    if (type === 'mcq') {
      const c = Number(r.response);
      s.choices[c] = (s.choices[c] || 0) + 1;
    } else if (type === 'tf') {
      s.item.data.answers.forEach((expected, i) => {
        if (r.response[i] === expected) s.statements[i] += 1;
      });
    } else if (type === 'short' && Number(r.points) < Number(r.max_points)) {
      const v = String(r.response).trim().replace('.', ',');
      s.wrongValues[v] = (s.wrongValues[v] || 0) + 1;
    }
  }
  return [...byItem.values()].map((s) => {
    const result = {
      id: s.item.id,
      position: s.item.position,
      type: s.item.type,
      topic: s.item.topic,
      difficulty: s.item.difficulty,
      n: s.n,
      blank: s.blank,
      fullRate: s.n ? Math.round((s.full / s.n) * 100) : null,
      scoreRate: s.max ? Math.round((s.earned / s.max) * 100) : null,
      note: '',
    };
    if (s.item.type === 'mcq') {
      result.choices = LETTERS.slice(0, s.item.data.options.length).split('').map((letter, i) => ({ letter, count: s.choices[i] || 0, correct: i === s.item.data.answer }));
      const distractor = result.choices.filter((c) => !c.correct).sort((a, b) => b.count - a.count)[0];
      if (distractor && distractor.count > 0 && s.n && distractor.count / s.n >= 0.25) {
        result.note = `Nhiều học viên chọn nhầm ${distractor.letter} (${distractor.count}/${s.n}).`;
      }
    } else if (s.item.type === 'tf') {
      result.statements = s.statements.map((c, i) => ({ label: 'abcd'[i], rate: s.n ? Math.round((c / s.n) * 100) : null }));
      const worst = result.statements.slice().sort((a, b) => a.rate - b.rate)[0];
      if (worst && worst.rate !== null && worst.rate < 50) result.note = `Ý ${worst.label} có tỉ lệ đúng thấp (${worst.rate}%).`;
    } else {
      result.wrongValues = Object.entries(s.wrongValues).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([value, count]) => ({ value, count }));
      if (result.wrongValues[0] && result.wrongValues[0].count >= 2) result.note = `Đáp số sai phổ biến: ${result.wrongValues[0].value} (${result.wrongValues[0].count} bài).`;
    }
    return result;
  });
}

// Gộp thống kê chủ đề từ nhiều bài làm (analysis_json) → mức độ thành thạo theo chủ đề.
function mergeTopicStats(analyses) {
  const map = new Map();
  for (const a of analyses) {
    for (const t of a?.byTopic || []) {
      if (!map.has(t.key)) map.set(t.key, { key: t.key, label: getTopic(t.key).name, earned: 0, max: 0, count: 0 });
      const g = map.get(t.key);
      g.earned += t.earned;
      g.max += t.max;
      g.count += t.count;
    }
  }
  return [...map.values()].map((g) => ({ ...g, pct: Math.round(pct(g.earned, g.max) * 100) })).sort((a, b) => a.pct - b.pct);
}

module.exports = { analyzeAttempt, diagnose, itemStatistics, mergeTopicStats, ERROR_LABELS, nextDifficulty, rank, STRONG, WEAK };
