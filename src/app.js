const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const helmet = require('helmet');
const compression = require('compression');

const config = require('./config');
const db = require('./db');
const { LEVELS } = require('./levels');
const { csrf, flash } = require('./lib/middleware');

const FONT_FILES = {
  'be-vietnam-pro': ['500', '600', '700', '800'],
  'noto-sans': ['400', '400-italic', '500', '600'],
};

// Gộp các file CSS @font-face cần dùng thành một file, trỏ URL về /vendor/<font>/files.
function buildFontsCss() {
  return Object.entries(FONT_FILES)
    .flatMap(([font, weights]) =>
      weights.map((w) => {
        const file = path.join(__dirname, '..', 'node_modules', '@fontsource', font, `${w}.css`);
        return fs.readFileSync(file, 'utf8').replace(/url\(\.\/files\//g, `url(/vendor/${font}/files/`);
      })
    )
    .join('\n');
}

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        // KaTeX và thanh tiến độ dùng thuộc tính style nội tuyến.
        styleSrc: ["'self'", "'unsafe-inline'"],
        fontSrc: ["'self'", 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
app.use(compression());
const staticOptions = { maxAge: config.isProduction ? '7d' : 0 };
app.use(express.static(path.join(__dirname, '..', 'public'), staticOptions));

// KaTeX và font chữ được phục vụ trực tiếp từ node_modules, không phụ thuộc CDN bên ngoài.
const modulesDir = path.join(__dirname, '..', 'node_modules');
app.use('/vendor/katex', express.static(path.join(modulesDir, 'katex', 'dist'), staticOptions));
app.use('/vendor/be-vietnam-pro', express.static(path.join(modulesDir, '@fontsource', 'be-vietnam-pro'), staticOptions));
app.use('/vendor/noto-sans', express.static(path.join(modulesDir, '@fontsource', 'noto-sans'), staticOptions));
const fontsCss = buildFontsCss();
app.get('/vendor/fonts.css', (req, res) => {
  res.type('text/css');
  if (config.isProduction) res.set('Cache-Control', 'public, max-age=604800');
  res.send(fontsCss);
});
app.use(express.urlencoded({ extended: false, limit: '2mb' }));
app.use(express.json({ limit: '1mb' }));

app.use(
  session({
    name: 'vl24.sid',
    secret: config.sessionSecret,
    store: new MySQLStore({ createDatabaseTable: true }, db.pool),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProduction,
      maxAge: 1000 * 60 * 60 * 24 * 14,
    },
  })
);

app.use(async (req, res, next) => {
  req.user = null;
  if (req.session.userId) {
    req.user = await db.one('SELECT id, name, email, role FROM users WHERE id = ?', [req.session.userId]);
    if (!req.user) delete req.session.userId;
  }
  res.locals.user = req.user;
  res.locals.siteName = config.siteName;
  res.locals.levels = LEVELS;
  res.locals.currentPath = req.path;
  res.locals.isStaff = Boolean(req.user && ['teacher', 'admin'].includes(req.user.role));
  next();
});
app.use(flash);
app.use(csrf);

app.use('/', require('./routes/public'));
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/learning'));
app.use('/quan-tri', require('./routes/admin'));

app.use((req, res) => {
  res.status(404).render('error', { title: 'Không tìm thấy trang', message: 'Trang bạn tìm không tồn tại hoặc đã bị xoá.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).render('error', { title: 'Đã có lỗi xảy ra', message: 'Máy chủ gặp sự cố. Vui lòng thử lại sau.' });
});

module.exports = app;
