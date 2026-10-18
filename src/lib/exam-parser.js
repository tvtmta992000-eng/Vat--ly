// Đọc đề mẫu (Word .docx, PDF có lớp chữ, hoặc văn bản) và phân tích cấu trúc:
// các phần, dạng câu, nội dung câu, phương án, đáp án (nếu đề kèm bảng đáp án), chủ đề và mức độ dự đoán.
const path = require('node:path');
const { classifyTopic, TOPICS } = require('./topics');
const { parseNumber } = require('./grading');

const MAX_TEXT = 300000;

class ParseError extends Error {}

async function extractText(buffer, filename) {
  const ext = path.extname(String(filename || '')).toLowerCase();
  if (ext === '.docx') {
    const mammoth = require('mammoth');
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch {
      throw new ParseError('Không đọc được file Word. Hãy chắc chắn file có đuôi .docx và không bị hỏng (file .doc cũ cần mở bằng Word rồi lưu lại thành .docx).');
    }
  }
  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse/lib/pdf-parse.js');
    try {
      const result = await pdfParse(buffer);
      return result.text;
    } catch {
      throw new ParseError('Không đọc được file PDF (file hỏng hoặc có mật khẩu).');
    }
  }
  if (ext === '.txt' || ext === '.md') {
    return buffer.toString('utf8');
  }
  if (ext === '.doc') {
    throw new ParseError('File .doc (Word 97–2003) chưa được hỗ trợ. Mở file bằng Word → Lưu thành (Save As) → chọn định dạng .docx rồi tải lên lại.');
  }
  throw new ParseError('Chỉ hỗ trợ file .docx, .pdf hoặc .txt.');
}

function normalizeText(text) {
  return String(text || '')
    .slice(0, MAX_TEXT)
    .replace(/\r\n?/g, '\n')
    .replace(/[   \t]/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .normalize('NFC');
}

const PART_RE = /^\s*PHẦN\s+(IV|I{1,3}|[1-4])\b\s*[.:\-–]?\s*(.*)$/i;
const QUESTION_RE = /^\s*Câu\s+(\d{1,3})\s*[.:)]\s*(.*)$/i;
const CONTEXT_RE = /^\s*(?:Sử dụng|Dùng)\s+(?:các\s+)?thông tin sau\s+(?:để\s+trả lời\s+|cho\s+)?(?:các\s+)?câu\s+(\d{1,3})\s*(?:và|đến|tới|-|–)\s*(?:câu\s+)?(\d{1,3})\s*[.:]?\s*(.*)$/i;
const KEY_RE = /^\s*(?:BẢNG\s+)?(?:ĐÁP\s*ÁN|HƯỚNG\s+DẪN\s+(?:CHẤM|GIẢI))\b/i;
const DURATION_RE = /Thời\s+gian(?:\s+làm\s+bài)?\s*[:：]?\s*(\d{1,3})\s*phút/i;
const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };

function partTypeFromTitle(title) {
  const t = title.toLowerCase();
  if (/đúng\s*[-/]?\s*sai/.test(t)) return 'tf';
  if (/trả lời ngắn|điền/.test(t)) return 'short';
  if (/nhiều phương án|lựa chọn|một phương án/.test(t)) return 'mcq';
  return null;
}

// Tìm 4 nhãn theo thứ tự từ cuối khối lên để tránh bắt nhầm chữ "A." trong nội dung câu.
function splitByLabels(block, labels, makeRe) {
  const positions = [];
  let end = block.length;
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    const re = makeRe(labels[i]);
    let found = null;
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(block)) && m.index < end) found = { index: m.index, length: m[0].length };
    if (!found) return null;
    positions.unshift(found);
    end = found.index;
  }
  const stem = block.slice(0, positions[0].index).trim();
  const parts = positions.map((p, i) => block.slice(p.index + p.length, i + 1 < positions.length ? positions[i + 1].index : block.length).trim());
  if (parts.some((p) => !p)) return null;
  return { stem, parts };
}

const MCQ_LABEL = (letter) => new RegExp(`(?:^|\\s)\\*?${letter}\\s*[.)]\\s+`, 'g');
const TF_LABEL = (letter) => new RegExp(`(?:^|\\s)${letter}\\s*\\)\\s*`, 'g');
const TF_LABEL_DOT = (letter) => new RegExp(`(?:^|\\n)\\s*${letter}\\s*[.)]\\s+`, 'g');

function guessDifficulty(type, text) {
  const numbers = (text.match(/\d+(?:[.,]\d+)?/g) || []).filter((n) => !/^[0-4]$/.test(n));
  const calc = numbers.length;
  if (type === 'short') return calc >= 1 ? 3 : 2;
  if (type === 'tf') return calc >= 3 ? 3 : 2;
  if (calc >= 3) return 3;
  if (calc >= 1 || /vì sao|giải thích|nhận xét|so sánh|tỉ lệ/i.test(text)) return 2;
  return 1;
}

function guessGrade(text) {
  const m = text.match(/(?:lớp|khối)\s*(10|11|12)\b/i) || text.match(/vật\s*lí?\s*(10|11|12)\b/i);
  if (m) return Number(m[1]);
  if (/tốt nghiệp|THPT\s+quốc gia|TN\s*THPT/i.test(text)) return 12;
  return null;
}

// Đọc phần đáp án. Nhận dạng theo hình thức đáp án: chữ cái A–D (nhiều lựa chọn),
// chuỗi 4 chữ Đ/S (đúng sai), số (trả lời ngắn).
function parseKey(keyText) {
  const key = { mcq: [], tf: [], short: [] };
  const sections = [];
  let current = { part: null, lines: [] };
  for (const line of keyText.split('\n')) {
    const pm = line.match(PART_RE);
    if (pm) {
      sections.push(current);
      current = { part: ROMAN[pm[1].toUpperCase()] || Number(pm[1]), type: partTypeFromTitle(pm[2] || ''), lines: [] };
    } else current.lines.push(line);
  }
  sections.push(current);

  for (const section of sections) {
    let text = section.lines.join('\n')
      .replace(/(?<!\p{L})Đúng(?!\p{L})/giu, 'Đ')
      .replace(/(?<!\p{L})Sai(?!\p{L})/giu, 'S');
    if (!section.type || section.type === 'tf') {
      const tfRe = /(?:Câu\s*)?(\d{1,3})\s*[-.:)]?\s*((?:[a-d]\s*[).]?\s*)?[ĐSđs](?:[\s,;|-]*(?:[a-d]\s*[).]?\s*)?[ĐSđs]){3})(?![\p{L}])/gu;
      text = text.replace(tfRe, (_, n, seq) => {
        const marks = seq.replace(/[a-d]\s*[).]?/g, '').match(/[ĐSđs]/g);
        key.tf.push({ n: Number(n), part: section.part, answers: marks.map((c) => c.toUpperCase() === 'Đ') });
        return ' ';
      });
    }
    if (!section.type || section.type === 'mcq') {
      const mcqRe = /(?:Câu\s*)?(\d{1,3})\s*[-.:)]?\s*([A-D])(?![\p{L}\d])/gu;
      text = text.replace(mcqRe, (_, n, letter) => {
        key.mcq.push({ n: Number(n), part: section.part, answer: 'ABCD'.indexOf(letter) });
        return ' ';
      });
    }
    if (!section.type || section.type === 'short') {
      const shortRe = /(?:Câu\s*)?(\d{1,3})\s*[-.:)]\s*(-?\d+(?:[.,]\d+)?)/gu;
      let m;
      while ((m = shortRe.exec(text))) {
        const value = parseNumber(m[2]);
        if (value !== null) {
          const decimals = (m[2].split(/[.,]/)[1] || '').length;
          key.short.push({ n: Number(m[1]), part: section.part, answer: value, decimals });
        }
      }
    }
  }
  return key;
}

function parseExamText(rawText) {
  const text = normalizeText(rawText);
  const warnings = [];
  const compact = text.replace(/\s+/g, ' ').trim();
  if (compact.length < 80) {
    throw new ParseError('File gần như không có chữ — có thể đề là ảnh chụp/scan. Hãy dùng file Word gõ chữ hoặc PDF có thể bôi đen chữ, hoặc thêm câu hỏi trực tiếp ở mục Ngân hàng câu hỏi.');
  }

  const lines = text.split('\n');
  let keyStart = -1;
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (KEY_RE.test(lines[i])) {
      keyStart = i;
      break;
    }
  }
  const bodyLines = keyStart >= 0 ? lines.slice(0, keyStart) : lines;
  const keyText = keyStart >= 0 ? lines.slice(keyStart + 1).join('\n') : '';

  const headerText = bodyLines.slice(0, 15).join('\n');
  const durationMatch = text.match(DURATION_RE);
  const durationMin = durationMatch ? Number(durationMatch[1]) : null;
  const grade = guessGrade(headerText) || guessGrade(text);
  const title = (bodyLines.find((l) => /ĐỀ|KIỂM TRA|THI/i.test(l) && l.trim().length > 5) || bodyLines.find((l) => l.trim()) || '').trim().slice(0, 200);

  const parts = [];
  const questions = [];
  const contexts = [];
  let part = null;
  let current = null;
  let contextCollector = null;

  const flush = () => {
    if (current) questions.push(current);
    current = null;
  };

  for (const line of bodyLines) {
    const pm = line.match(PART_RE);
    if (pm) {
      flush();
      contextCollector = null;
      part = { index: parts.length + 1, title: line.trim(), type: partTypeFromTitle(line) };
      parts.push(part);
      continue;
    }
    const cm = line.match(CONTEXT_RE);
    if (cm) {
      flush();
      contextCollector = { from: Number(cm[1]), to: Number(cm[2]), part: part ? part.index : 1, lines: [cm[3] || ''] };
      contexts.push(contextCollector);
      continue;
    }
    const qm = line.match(QUESTION_RE);
    if (qm) {
      flush();
      contextCollector = null;
      current = { part: part ? part.index : 1, number: Number(qm[1]), lines: [qm[2]] };
      continue;
    }
    if (current) current.lines.push(line);
    else if (contextCollector) contextCollector.lines.push(line);
  }
  flush();

  if (!questions.length) {
    throw new ParseError('Không tìm thấy câu hỏi nào. Mỗi câu cần bắt đầu bằng "Câu 1.", "Câu 2:"… ở đầu dòng. Nếu đề là ảnh chụp/scan thì không đọc được chữ.');
  }

  const result = questions.map((q) => {
    const block = q.lines.join('\n').trim();
    const partInfo = parts[q.part - 1];
    const ctx = contexts.find((c) => c.part === q.part && q.number >= c.from && q.number <= c.to);
    const context = ctx ? ctx.lines.join('\n').trim() : null;
    const notes = [];
    let type = partInfo?.type || null;
    let stem = block;
    let options = null;
    let statements = null;

    const mcq = splitByLabels(block, ['A', 'B', 'C', 'D'], MCQ_LABEL);
    const tf = splitByLabels(block, ['a', 'b', 'c', 'd'], TF_LABEL) || splitByLabels(block, ['a', 'b', 'c', 'd'], TF_LABEL_DOT);
    if (!type) type = mcq ? 'mcq' : tf ? 'tf' : 'short';
    if (type === 'mcq' && mcq) {
      stem = mcq.stem;
      options = mcq.parts.map((p) => p.replace(/\s+/g, ' '));
    } else if (type === 'tf' && tf) {
      stem = tf.stem;
      statements = tf.parts.map((p) => p.replace(/\s+/g, ' '));
    } else if (type === 'mcq') {
      notes.push('Không tách được 4 phương án A, B, C, D — hãy nhập lại.');
      options = ['', '', '', ''];
    } else if (type === 'tf') {
      notes.push('Không tách được 4 ý a), b), c), d) — hãy nhập lại.');
      statements = ['', '', '', ''];
    }
    stem = stem.replace(/\n{2,}/g, '\n').trim();
    if (/hình (vẽ|bên|dưới)|đồ thị|như hình/i.test(stem) && !/!\[/.test(stem)) {
      notes.push('Câu có nhắc tới hình vẽ/đồ thị — hãy bổ sung ảnh hoặc mô tả bằng lời.');
    }
    const fullText = [context, stem, ...(options || []), ...(statements || [])].filter(Boolean).join(' ');
    const topic = classifyTopic(fullText, grade);
    if (!topic) notes.push('Chưa nhận diện được chủ đề — hãy chọn chủ đề.');
    return {
      part: q.part,
      number: q.number,
      type,
      context,
      stem,
      options,
      statements,
      answer: null,
      answers: null,
      decimals: 2,
      topic: topic || (grade ? TOPICS.find((t) => t.grade === grade)?.key : TOPICS[TOPICS.length - 1].key),
      topicGuessed: Boolean(topic),
      difficulty: guessDifficulty(type, fullText),
      notes,
    };
  });

  // Ghép đáp án
  let keyFound = 0;
  if (keyText.trim()) {
    const key = parseKey(keyText);
    for (const type of ['mcq', 'tf', 'short']) {
      const qs = result.filter((q) => q.type === type);
      const entries = key[type];
      for (const q of qs) {
        const match = entries.find((e) => e.n === q.number && (e.part === null || e.part === q.part))
          || entries.find((e) => e.n === q.number);
        if (!match) continue;
        if (type === 'mcq' && match.answer < (q.options || []).length) q.answer = match.answer;
        if (type === 'tf') q.answers = match.answers;
        if (type === 'short') {
          q.answer = match.answer;
          q.decimals = match.decimals;
        }
        keyFound += 1;
      }
    }
  }
  for (const q of result) {
    const missing = (q.type === 'mcq' && q.answer === null) || (q.type === 'tf' && !q.answers) || (q.type === 'short' && q.answer === null);
    if (missing) q.notes.push('Chưa có đáp án — hãy chọn/nhập đáp án.');
  }
  if (!keyText.trim()) warnings.push('Đề không kèm bảng đáp án (mục "ĐÁP ÁN" ở cuối file) — cần nhập đáp án cho từng câu trước khi lưu.');
  else if (keyFound < result.length) warnings.push(`Đọc được đáp án của ${keyFound}/${result.length} câu.`);
  if (parts.length === 0) warnings.push('Đề không chia phần (PHẦN I, II, III) — dạng câu được đoán theo phương án.');
  warnings.push('Công thức dạng Equation của Word và hình ảnh không được trích xuất — kiểm tra lại nội dung từng câu.');

  return {
    title,
    durationMin,
    grade,
    parts: parts.map((p) => ({ index: p.index, title: p.title, type: p.type })),
    questions: result,
    keyFound,
    warnings,
  };
}

module.exports = { extractText, parseExamText, parseKey, ParseError };
