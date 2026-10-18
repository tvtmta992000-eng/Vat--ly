const crypto = require('node:crypto');

// Token CSRF cho mỗi phiên, kiểm tra trên mọi request POST.
function csrf(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  res.locals.csrfToken = req.session.csrfToken;

  if (req.method === 'POST') {
    // Form tải file (multipart) chưa được đọc ở bước này nên token gửi kèm trên URL.
    const fromQuery = req.is('multipart/form-data') ? req.query._csrf : '';
    const sent = String((req.body && req.body._csrf) || req.get('x-csrf-token') || fromQuery || '');
    const expected = req.session.csrfToken;
    const valid = sent.length === expected.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected));
    if (!valid) {
      return res.status(403).render('error', { title: 'Phiên làm việc hết hạn', message: 'Vui lòng tải lại trang và thử lại.' });
    }
  }
  next();
}

// Thông báo một lần (flash) lưu trong session.
function flash(req, res, next) {
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  req.flash = (type, message) => {
    req.session.flash = { type, message };
  };
  next();
}

function requireLogin(req, res, next) {
  if (req.user) return next();
  req.flash('info', 'Vui lòng đăng nhập để tiếp tục.');
  res.redirect(`/dang-nhap?next=${encodeURIComponent(req.originalUrl)}`);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return requireLogin(req, res, next);
    if (roles.includes(req.user.role)) return next();
    res.status(403).render('error', { title: 'Không có quyền truy cập', message: 'Trang này chỉ dành cho giáo viên và quản trị viên.' });
  };
}

// Chỉ cho phép chuyển hướng nội bộ để tránh open redirect.
function safeNext(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

module.exports = { csrf, flash, requireLogin, requireRole, safeNext };
