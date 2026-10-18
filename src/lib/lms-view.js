// Chuẩn bị dữ liệu hiển thị cho đề/bài làm và tiện ích xuất CSV.
const { render, renderInline } = require('./markdown');
const { PART_TITLES } = require('./generator');
const { getTopic, DIFFICULTIES, TYPES } = require('./topics');
const { displayAnswer } = require('./bank');

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

function score(n, digits = 2) {
  if (n === null || n === undefined || n === '') return '—';
  const v = Math.round(Number(n) * 10 ** digits) / 10 ** digits;
  return String(v).replace('.', ',');
}

// Gom câu theo phần, đánh số lại trong từng phần (như đề TN THPT), gắn HTML đã render
// và đánh dấu câu đầu tiên của nhóm dùng chung dữ kiện.
function prepareExam(items) {
  const parts = [];
  for (const item of items) {
    let part = parts[parts.length - 1];
    if (!part || part.part !== item.part) {
      part = { part: item.part, type: item.type, items: [] };
      parts.push(part);
    }
    part.items.push(item);
  }
  parts.forEach((part, pi) => {
    part.title = `PHẦN ${ROMAN[pi + 1] || pi + 1}. ${PART_TITLES[part.type] || ''}`;
    part.points = part.items.reduce((s, it) => s + it.points, 0);
    part.items.forEach((item, i) => {
      item.number = i + 1;
      item.view = {
        stemHtml: render(item.stem || ''),
        optionsHtml: item.type === 'mcq' ? item.data.options.map((o) => renderInline(o)) : null,
        statementsHtml: item.type === 'tf' ? item.data.statements.map((s) => renderInline(s)) : null,
        explanationHtml: item.explanation ? render(item.explanation) : '',
        topicName: getTopic(item.topic).name,
        difficultyName: DIFFICULTIES[item.difficulty],
        typeName: TYPES[item.type],
        answerText: answerText(item),
      };
    });
    // Dữ kiện chung: hiện một lần trước nhóm câu liên tiếp có cùng dữ kiện
    for (let i = 0; i < part.items.length; i += 1) {
      const item = part.items[i];
      if (!item.context || (i > 0 && part.items[i - 1].context === item.context)) continue;
      let j = i;
      while (j + 1 < part.items.length && part.items[j + 1].context === item.context) j += 1;
      item.view.contextHtml = render(item.context);
      item.view.contextLabel = j > i ? `Sử dụng thông tin sau cho câu ${item.number} và câu ${part.items[j].number}` : 'Đọc thông tin sau';
    }
  });
  return parts;
}

function answerText(item) {
  if (item.type === 'mcq') return 'ABCDEF'[item.data.answer];
  if (item.type === 'tf') return item.data.answers.map((a, i) => `${'abcd'[i]}) ${a ? 'Đúng' : 'Sai'}`).join(' · ');
  if (item.type === 'short') return `${displayAnswer(Number(item.data.answer), item.data.decimals ?? 2)}${item.data.unit ? ` ${item.data.unit}` : ''}`;
  return '';
}

function responseText(item, response) {
  if (response === null || response === undefined) return '(bỏ trống)';
  if (item.type === 'mcq') return 'ABCDEF'[Number(response)] || '(bỏ trống)';
  if (item.type === 'tf') {
    return [0, 1, 2, 3].map((i) => `${'abcd'[i]}) ${response[i] === true ? 'Đ' : response[i] === false ? 'S' : '–'}`).join(' ');
  }
  return String(response);
}

// CSV có BOM để Excel đọc đúng tiếng Việt
function toCsv(rows) {
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'number' ? String(v).replace('.', ',') : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `﻿${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
}

function sendCsv(res, filename, rows) {
  const safe = filename.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9_-]+/g, '-');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="${safe}.csv"`);
  res.send(toCsv(rows));
}

module.exports = { prepareExam, answerText, responseText, score, toCsv, sendCsv };
