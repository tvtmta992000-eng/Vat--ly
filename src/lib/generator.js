// Khung đề (blueprint) và sinh đề tự động từ ngân hàng câu hỏi.
//
// structure = {
//   parts: [
//     { part: 1, title: 'PHẦN I. ...', type: 'mcq', points: 0.25,
//       slots: [ { topic: 'vl12-c1' | null, difficulty: 1 | null, count: 3 }, ... ] }
//   ]
// }
// topic = null: lấy theo danh sách chủ đề giáo viên chọn khi sinh đề. difficulty = null: mức nào cũng được.
const { instantiate } = require('./bank');
const { getTopic, DIFFICULTIES, TYPES } = require('./topics');
const { roundPoints } = require('./grading');

const DEFAULT_POINTS = { mcq: 0.25, tf: 1, short: 0.25 };
const PART_TITLES = {
  mcq: 'Trắc nghiệm nhiều phương án lựa chọn',
  tf: 'Trắc nghiệm đúng sai',
  short: 'Trắc nghiệm trả lời ngắn',
};
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

// Bộ sinh số ngẫu nhiên có hạt giống — cùng hạt giống cho cùng một đề.
function seededRng(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
  return function mulberry32() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle(list, rng) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function partLabel(index) {
  return `PHẦN ${ROMAN[index] || index}`;
}

// Kiểm tra và chuẩn hoá cấu trúc khung đề (từ form hoặc JSON).
function normalizeStructure(input) {
  const errors = [];
  const parts = [];
  for (const [i, raw] of (input?.parts || []).entries()) {
    const type = ['mcq', 'tf', 'short'].includes(raw.type) ? raw.type : null;
    if (!type) {
      errors.push(`Phần ${i + 1}: dạng câu không hợp lệ.`);
      continue;
    }
    const points = Number(raw.points);
    const slots = [];
    for (const s of raw.slots || []) {
      const count = Number.parseInt(s.count, 10);
      if (!(count > 0)) continue;
      const difficulty = [1, 2, 3].includes(Number(s.difficulty)) ? Number(s.difficulty) : null;
      const topic = s.topic && getTopic(s.topic).lessons.length ? s.topic : null;
      slots.push({ topic, difficulty, count: Math.min(count, 100) });
    }
    if (!slots.length) {
      errors.push(`Phần ${i + 1}: cần ít nhất một câu.`);
      continue;
    }
    parts.push({
      part: parts.length + 1,
      title: String(raw.title || `${partLabel(parts.length + 1)}. ${PART_TITLES[type]}`).slice(0, 200),
      type,
      points: points > 0 && points <= 100 ? roundPoints(points) : DEFAULT_POINTS[type],
      slots,
    });
  }
  if (!parts.length && !errors.length) errors.push('Khung đề chưa có phần nào.');
  return { structure: { parts }, errors };
}

function summarize(structure) {
  let questions = 0;
  let points = 0;
  for (const p of structure.parts) {
    const n = p.slots.reduce((s, slot) => s + slot.count, 0);
    questions += n;
    points += n * p.points;
  }
  return { questions, points: roundPoints(points) };
}

// Gộp các câu liên tiếp cùng chủ đề + mức độ thành một ô của khung đề (giữ thứ tự để câu dùng chung
// dữ kiện vẫn đứng cạnh nhau khi sinh đề mới).
function structureFromItems(items) {
  const byPart = new Map();
  for (const item of items) {
    const key = item.part || 1;
    if (!byPart.has(key)) byPart.set(key, []);
    byPart.get(key).push(item);
  }
  const parts = [];
  for (const [, list] of [...byPart.entries()].sort((a, b) => a[0] - b[0])) {
    const counts = {};
    list.forEach((it) => { counts[it.type] = (counts[it.type] || 0) + 1; });
    const type = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const pointsSet = [...new Set(list.map((it) => Number(it.points)).filter((p) => p > 0))];
    const slots = [];
    for (const it of list.filter((x) => x.type === type)) {
      const last = slots[slots.length - 1];
      if (last && last.topic === (it.topic || null) && last.difficulty === (it.difficulty || null)) last.count += 1;
      else slots.push({ topic: it.topic || null, difficulty: it.difficulty || null, count: 1 });
    }
    parts.push({
      part: parts.length + 1,
      title: `${partLabel(parts.length + 1)}. ${PART_TITLES[type]}`,
      type,
      points: pointsSet.length === 1 ? pointsSet[0] : DEFAULT_POINTS[type],
      slots,
    });
  }
  return { parts };
}

// Sinh đề.
//   bank: mảng câu hỏi (fromRow) — thường là toàn bộ ngân hàng của các dạng cần dùng
//   options.topics: chủ đề cho các ô topic = null (rỗng = mọi chủ đề, lọc theo grades nếu có)
//   options.grades: lớp được dùng khi topic = null
//   options.excludeIds / excludeFamilies: không dùng các câu/họ câu này
//   options.avoidIds: hạn chế dùng (ví dụ câu học viên đã làm) — chỉ dùng khi hết câu khác
// Trả về { items, warnings }
function generate(structure, bank, options = {}) {
  const seed = options.seed ?? Math.floor(Math.random() * 2 ** 31);
  const rng = seededRng(seed);
  const allowedTopics = options.topics?.length ? new Set(options.topics) : null;
  const grades = options.grades?.length ? new Set(options.grades.map(Number)) : null;
  const usedIds = new Set(options.excludeIds || []);
  const usedFamilies = new Set(options.excludeFamilies || []);
  // Câu học viên đã gặp: vẫn dùng được nhưng xếp sau cùng
  const avoid = new Set(options.avoidIds || []);
  const items = [];
  const warnings = [];

  const topicOk = (q) => (allowedTopics ? allowedTopics.has(q.topic) : !grades || grades.has(Number(q.grade)));

  for (const part of structure.parts) {
    const pool = shuffle(bank.filter((q) => q.type === part.type), rng)
      .sort((a, b) => Number(avoid.has(a.id)) - Number(avoid.has(b.id)));
    for (const slot of part.slots) {
      for (let n = 0; n < slot.count; n += 1) {
        const free = (q) => !usedIds.has(q.id) && !(q.family && usedFamilies.has(q.family));
        const sameTopic = (q) => (slot.topic ? q.topic === slot.topic : topicOk(q));
        const sameDiff = (q) => !slot.difficulty || q.difficulty === slot.difficulty;
        const nearDiff = (a, b) => Math.abs(a.difficulty - (slot.difficulty || 2)) - Math.abs(b.difficulty - (slot.difficulty || 2));

        let pick = pool.find((q) => free(q) && sameTopic(q) && sameDiff(q));
        let note = null;
        if (!pick) {
          pick = pool.filter((q) => free(q) && sameTopic(q)).sort(nearDiff)[0];
          if (pick) note = `thiếu câu ${DIFFICULTIES[slot.difficulty]} → dùng câu ${DIFFICULTIES[pick.difficulty]}`;
        }
        if (!pick && slot.topic) {
          // Chủ đề cùng lớp
          const grade = getTopic(slot.topic).grade;
          pick = pool.filter((q) => free(q) && Number(q.grade) === grade && topicOk(q) && sameDiff(q))[0]
            || pool.filter((q) => free(q) && Number(q.grade) === grade).sort(nearDiff)[0];
          if (pick) note = `hết câu chủ đề "${getTopic(slot.topic).name}" → dùng chủ đề "${getTopic(pick.topic).name}"`;
        }
        if (!pick) {
          // Cho phép câu cùng "họ" nếu có biến thể số liệu (sẽ khác số)
          pick = pool.find((q) => !usedIds.has(q.id) && q.template && sameTopic(q));
          if (pick) note = 'dùng lại dạng bài đã có (khác số liệu)';
        }
        const where = `${part.title.split('.')[0]}, ${slot.topic ? getTopic(slot.topic).name : 'chủ đề tự chọn'}${slot.difficulty ? `, ${DIFFICULTIES[slot.difficulty]}` : ''}`;
        if (!pick) {
          warnings.push(`${where}: ngân hàng không còn câu ${TYPES[part.type]} phù hợp — đề thiếu 1 câu.`);
          continue;
        }
        if (note) warnings.push(`${where}: ${note}.`);
        usedIds.add(pick.id);
        if (pick.family) usedFamilies.add(pick.family);

        // Các câu dùng chung dữ kiện nhận cùng bộ số liệu nhờ hạt giống theo nội dung dữ kiện.
        const variantRng = pick.context ? seededRng(`${seed}|${pick.context}`) : rng;
        const concrete = instantiate(pick, { rng: variantRng, useDefault: options.useDefault });
        items.push({
          part: part.part,
          points: part.points,
          bankQuestionId: pick.id,
          type: pick.type,
          topic: pick.topic,
          difficulty: pick.difficulty,
          context: concrete.context,
          stem: concrete.stem,
          data: concrete.data,
          explanation: concrete.explanation,
        });
      }
    }
  }
  items.forEach((it, i) => { it.position = i + 1; });
  return { items, warnings: [...new Set(warnings)], seed };
}

// Khung đề có sẵn (tạo khi khởi động nếu chưa có).
const BUILTIN_BLUEPRINTS = [
  {
    key: 'bp-tn-chuan',
    name: 'Đề thi TN THPT chuẩn (18 – 4 – 6), tự chọn chủ đề',
    kind: 'exam',
    duration: 50,
    note: 'Cấu trúc đề tốt nghiệp THPT từ 2025: 18 câu nhiều lựa chọn, 4 câu đúng sai, 6 câu trả lời ngắn — thang 10 điểm.',
    structure: {
      parts: [
        { type: 'mcq', points: 0.25, slots: [{ difficulty: 1, count: 10 }, { difficulty: 2, count: 6 }, { difficulty: 3, count: 2 }] },
        { type: 'tf', points: 1, slots: [{ difficulty: 2, count: 2 }, { difficulty: 3, count: 2 }] },
        { type: 'short', points: 0.25, slots: [{ difficulty: 2, count: 2 }, { difficulty: 3, count: 4 }] },
      ],
    },
  },
  {
    key: 'bp-45-phut',
    name: 'Kiểm tra 45 phút (16 – 2 – 4)',
    kind: 'test',
    duration: 45,
    note: '16 câu nhiều lựa chọn (4 điểm), 2 câu đúng sai (4 điểm), 4 câu trả lời ngắn (2 điểm).',
    structure: {
      parts: [
        { type: 'mcq', points: 0.25, slots: [{ difficulty: 1, count: 8 }, { difficulty: 2, count: 6 }, { difficulty: 3, count: 2 }] },
        { type: 'tf', points: 2, slots: [{ difficulty: 2, count: 1 }, { difficulty: 3, count: 1 }] },
        { type: 'short', points: 0.5, slots: [{ difficulty: 2, count: 2 }, { difficulty: 3, count: 2 }] },
      ],
    },
  },
  {
    key: 'bp-15-phut',
    name: 'Kiểm tra 15 phút (10 câu trắc nghiệm)',
    kind: 'test',
    duration: 15,
    note: '10 câu nhiều lựa chọn, mỗi câu 1 điểm.',
    structure: {
      parts: [{ type: 'mcq', points: 1, slots: [{ difficulty: 1, count: 4 }, { difficulty: 2, count: 4 }, { difficulty: 3, count: 2 }] }],
    },
  },
  {
    key: 'bp-luyen-tap',
    name: 'Luyện tập nhanh (8 – 1 – 2)',
    kind: 'practice',
    duration: null,
    note: 'Bài luyện tập ngắn đủ ba dạng câu, không giới hạn thời gian.',
    structure: {
      parts: [
        { type: 'mcq', points: 0.5, slots: [{ difficulty: 1, count: 3 }, { difficulty: 2, count: 3 }, { difficulty: 3, count: 2 }] },
        { type: 'tf', points: 4, slots: [{ difficulty: 2, count: 1 }] },
        { type: 'short', points: 1, slots: [{ difficulty: 2, count: 1 }, { difficulty: 3, count: 1 }] },
      ],
    },
  },
];

module.exports = {
  DEFAULT_POINTS,
  PART_TITLES,
  BUILTIN_BLUEPRINTS,
  seededRng,
  shuffle,
  normalizeStructure,
  structureFromItems,
  summarize,
  generate,
};
