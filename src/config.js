require('dotenv').config({ quiet: true });

const env = process.env;

const config = {
  port: Number(env.PORT) || 3000,
  isProduction: env.NODE_ENV === 'production',
  siteName: 'Vật Lý Example24',
  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'vatly_example24',
  },
  sessionSecret: env.SESSION_SECRET || 'dev-only-secret-change-me',
  admin: {
    email: env.ADMIN_EMAIL,
    password: env.ADMIN_PASSWORD,
    name: env.ADMIN_NAME || 'Quản trị viên',
  },
  autoMigrate: env.AUTO_MIGRATE !== 'false',
  seedSampleContent: env.SEED_SAMPLE_CONTENT !== 'false',
};

if (config.isProduction && config.sessionSecret === 'dev-only-secret-change-me') {
  console.warn('[cảnh báo] SESSION_SECRET chưa được đặt — hãy đặt trong biến môi trường.');
}

module.exports = config;
