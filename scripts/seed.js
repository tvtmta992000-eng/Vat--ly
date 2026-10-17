const { migrate } = require('../src/schema');
const { ensureAdmin, seedSampleContent } = require('../src/seed');
const db = require('../src/db');

(async () => {
  try {
    await migrate();
    console.log(await ensureAdmin() ? 'Đã tạo tài khoản admin.' : 'Tài khoản admin đã có hoặc chưa cấu hình ADMIN_EMAIL/ADMIN_PASSWORD.');
    console.log(await seedSampleContent() ? 'Đã thêm nội dung mẫu.' : 'Đã có nội dung, bỏ qua dữ liệu mẫu.');
  } catch (err) {
    console.error('Lỗi seed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
