// Biểu đồ SVG dựng sẵn phía máy chủ (không cần thư viện JS). Màu lấy từ CSS (.chart-*).
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function fmt(n, digits = 1) {
  const v = Math.round(n * 10 ** digits) / 10 ** digits;
  return String(v).replace('.', ',');
}

// Biểu đồ đường: tiến bộ điểm theo thời gian (thang 0–max).
// points: [{ label: '20/10', value: 7.5, title: 'Tên bài' }]
function lineChart(points, { max = 10, height = 220, label = 'Điểm theo thời gian' } = {}) {
  if (!points.length) return '';
  const width = 640;
  const pad = { top: 16, right: 16, bottom: 34, left: 36 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const x = (i) => pad.left + (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const y = (v) => pad.top + h - (Math.max(0, Math.min(max, v)) / max) * h;
  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const v = max * f;
    return `<line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${y(v)}" y2="${y(v)}"/>`
      + `<text class="chart-axis" x="${pad.left - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v, 1)}</text>`;
  }).join('');
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
  const area = `${path} L${x(points.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const step = Math.ceil(points.length / 8);
  const dots = points.map((p, i) => `<circle class="chart-dot" cx="${x(i).toFixed(1)}" cy="${y(p.value).toFixed(1)}" r="4"><title>${esc(p.title || p.label)}: ${fmt(p.value, 2)}</title></circle>`
    + (i % step === 0 || i === points.length - 1 ? `<text class="chart-axis" x="${x(i).toFixed(1)}" y="${height - 12}" text-anchor="middle">${esc(p.label)}</text>` : '')).join('');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${grid}<path class="chart-area" d="${area}"/><path class="chart-line" d="${path}"/>${dots}</svg>`;
}

// Phổ điểm (histogram) thang 10: số bài theo từng khoảng điểm.
function histogram(scores10, { height = 200, label = 'Phổ điểm' } = {}) {
  const bins = Array.from({ length: 10 }, () => 0);
  scores10.forEach((s) => { bins[Math.min(9, Math.max(0, Math.floor(s)))] += 1; });
  const width = 640;
  const pad = { top: 18, right: 12, bottom: 34, left: 32 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const top = Math.max(1, ...bins);
  const bw = w / bins.length;
  const bars = bins.map((n, i) => {
    const bh = (n / top) * h;
    const x0 = pad.left + i * bw + 4;
    const y0 = pad.top + h - bh;
    const tone = i >= 8 ? 'good' : i >= 5 ? 'ok' : 'low';
    return `<rect class="chart-bar chart-${tone}" x="${x0.toFixed(1)}" y="${y0.toFixed(1)}" width="${(bw - 8).toFixed(1)}" height="${bh.toFixed(1)}" rx="4"><title>${i}–${i + 1} điểm: ${n} bài</title></rect>`
      + (n ? `<text class="chart-value" x="${(x0 + (bw - 8) / 2).toFixed(1)}" y="${(y0 - 5).toFixed(1)}" text-anchor="middle">${n}</text>` : '')
      + `<text class="chart-axis" x="${(x0 + (bw - 8) / 2).toFixed(1)}" y="${height - 12}" text-anchor="middle">${i}–${i + 1}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}"><line class="chart-grid" x1="${pad.left}" x2="${width - pad.right}" y1="${pad.top + h}" y2="${pad.top + h}"/>${bars}</svg>`;
}

module.exports = { lineChart, histogram };
