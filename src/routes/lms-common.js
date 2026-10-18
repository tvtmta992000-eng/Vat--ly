// Tiện ích dùng chung cho các route hệ thống học tập.
const { LmsError } = require('../lib/lms');

const toInt = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
};

// Bọc handler: lỗi nghiệp vụ (LmsError) → thông báo và quay lại trang trước; lỗi khác → trang lỗi chung.
function action(handler, fallback) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      if (err instanceof LmsError) {
        if (req.accepts(['html', 'json']) === 'json' || req.is('application/json')) {
          return res.status(err.status).json({ ok: false, error: err.message });
        }
        req.flash('error', err.message);
        const back = typeof fallback === 'function' ? fallback(req) : fallback || req.get('Referer') || '/';
        return res.redirect(back.startsWith('/') || back.startsWith(`${req.protocol}://${req.get('host')}`) ? back : '/');
      }
      next(err);
    }
  };
}

function notFound(res, message = 'Không tìm thấy nội dung yêu cầu hoặc bạn không có quyền xem.') {
  return res.status(404).render('error', { title: 'Không tìm thấy', message });
}

function forbidden(res, message = 'Bạn không có quyền thực hiện thao tác này.') {
  return res.status(403).render('error', { title: 'Không có quyền truy cập', message });
}

module.exports = { toInt, action, notFound, forbidden };
