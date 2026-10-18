const config = require('./src/config');
const app = require('./src/app');
const { migrate } = require('./src/schema');
const { ensureAdmin, seedSampleContent } = require('./src/seed');
const { seedBank } = require('./src/lib/lms');

async function start() {
  if (config.autoMigrate) {
    try {
      await migrate();
      if (await ensureAdmin()) console.log(`Đã tạo tài khoản admin: ${config.admin.email}`);
      if (config.seedSampleContent && (await seedSampleContent())) console.log('Đã thêm nội dung mẫu.');
      const bank = await seedBank();
      if (bank.added) console.log(`Đã nạp ${bank.added} câu hỏi vào ngân hàng.`);
      bank.errors.forEach((e) => console.warn('[ngân hàng]', e));
    } catch (err) {
      console.error('Không thể khởi tạo cơ sở dữ liệu:', err.message);
    }
  }

  app.listen(config.port, () => {
    console.log(`${config.siteName} đang chạy tại http://localhost:${config.port}`);
  });
}

start();
