const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { safeNext, requireLogin } = require('../lib/middleware');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).render('error', { title: 'Thử lại sau', message: 'Bạn đã thử quá nhiều lần. Vui lòng đợi 15 phút.' }),
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function logIn(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err);
      req.session.userId = user.id;
      resolve();
    });
  });
}

router.get('/dang-nhap', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/login', { title: 'Đăng nhập', values: {}, errors: {}, next: safeNext(req.query.next) });
});

router.post('/dang-nhap', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const next = safeNext(req.body.next);
  const user = email ? await db.one('SELECT * FROM users WHERE email = ?', [email]) : null;
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) {
    return res.status(400).render('auth/login', {
      title: 'Đăng nhập',
      values: { email },
      errors: { form: 'Email hoặc mật khẩu không đúng.' },
      next,
    });
  }
  await logIn(req, user);
  req.flash('success', `Chào mừng trở lại, ${user.name}!`);
  res.redirect(next);
});

router.get('/dang-ky', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('auth/register', { title: 'Đăng ký', values: {}, errors: {} });
});

router.post('/dang-ky', authLimiter, async (req, res) => {
  const values = {
    name: String(req.body.name || '').trim(),
    email: String(req.body.email || '').trim().toLowerCase(),
  };
  const password = String(req.body.password || '');
  const errors = {};
  if (values.name.length < 2) errors.name = 'Vui lòng nhập họ tên (ít nhất 2 ký tự).';
  if (!EMAIL_PATTERN.test(values.email)) errors.email = 'Email không hợp lệ.';
  if (password.length < 8) errors.password = 'Mật khẩu cần ít nhất 8 ký tự.';
  if (password !== req.body.password_confirm) errors.password_confirm = 'Mật khẩu nhập lại không khớp.';
  if (!errors.email && (await db.one('SELECT id FROM users WHERE email = ?', [values.email]))) {
    errors.email = 'Email này đã được đăng ký.';
  }
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('auth/register', { title: 'Đăng ký', values, errors });
  }

  const hash = await bcrypt.hash(password, 12);
  const result = await db.query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [
    values.name,
    values.email,
    hash,
  ]);
  await logIn(req, { id: result.insertId });
  req.flash('success', 'Tạo tài khoản thành công. Chúc bạn học tốt!');
  res.redirect('/');
});

router.get('/doi-mat-khau', requireLogin, (req, res) => {
  res.render('auth/change-password', { title: 'Đổi mật khẩu', errors: {} });
});

router.post('/doi-mat-khau', requireLogin, authLimiter, async (req, res) => {
  const current = String(req.body.current_password || '');
  const password = String(req.body.password || '');
  const errors = {};
  const row = await db.one('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!row || !(await bcrypt.compare(current, row.password_hash))) errors.current_password = 'Mật khẩu hiện tại không đúng.';
  if (password.length < 8) errors.password = 'Mật khẩu mới cần ít nhất 8 ký tự.';
  if (password !== req.body.password_confirm) errors.password_confirm = 'Mật khẩu nhập lại không khớp.';
  if (Object.keys(errors).length > 0) {
    return res.status(400).render('auth/change-password', { title: 'Đổi mật khẩu', errors });
  }
  const hash = await bcrypt.hash(password, 12);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
  req.flash('success', 'Đã đổi mật khẩu thành công.');
  res.redirect('/tien-do');
});

router.post('/dang-xuat', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('vl24.sid');
    res.redirect('/');
  });
});

module.exports = router;
