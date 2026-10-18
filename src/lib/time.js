// Thời gian hiển thị và nhập theo giờ Việt Nam (UTC+7, không đổi giờ mùa hè),
// bất kể máy chủ đặt múi giờ nào. Trong DB lưu Date (mysql2 tự chuyển đổi).
const OFFSET_MIN = 7 * 60;
const TIME_ZONE = 'Asia/Ho_Chi_Minh';

// "2026-10-20T08:00" (ô datetime-local) → Date; rỗng/không hợp lệ → null
function parseLocalInput(value) {
  const m = String(value || '').trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return null;
  const utc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) - OFFSET_MIN * 60000;
  const date = new Date(utc);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shifted(date) {
  return new Date(new Date(date).getTime() + OFFSET_MIN * 60000);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

// Date → "2026-10-20T08:00" để điền lại vào ô datetime-local
function toLocalInput(date) {
  if (!date) return '';
  const d = shifted(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

// Date → "20/10/2026 08:00"
function formatDateTime(date) {
  if (!date) return '';
  const d = shifted(date);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

function formatDate(date) {
  if (!date) return '';
  const d = shifted(date);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

// Số giây → "12 phút 05 giây"
function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h) return `${h} giờ ${pad(m)} phút`;
  if (m) return `${m} phút ${pad(sec)} giây`;
  return `${sec} giây`;
}

module.exports = { TIME_ZONE, parseLocalInput, toLocalInput, formatDateTime, formatDate, formatDuration };
