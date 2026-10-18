// Nạp câu hỏi vào ngân hàng từ file trong content/ngan-hang/.
//   npm run nap-ngan-hang                                     nạp mọi file, bỏ qua câu đã có
//   npm run nap-ngan-hang -- content/ngan-hang/de-tn-2026.js  chỉ nạp file này
//   thêm --cap-nhat để ghi đè câu đã có (cùng key) bằng nội dung trong file
//   thêm --tu-bai-hoc để chép câu trắc nghiệm của các bài học vào ngân hàng
const path = require('node:path');
const { migrate } = require('../src/schema');
const lms = require('../src/lib/lms');
const db = require('../src/db');

(async () => {
  const args = process.argv.slice(2);
  const files = args.filter((a) => !a.startsWith('--')).map((f) => path.resolve(f));
  try {
    await migrate();
    for (const file of files.length ? files : lms.bankFiles()) {
      const stats = await lms.importBank(require(file), { update: args.includes('--cap-nhat') });
      console.log(`${path.basename(file)}: thêm ${stats.added}, cập nhật ${stats.updated}, bỏ qua ${stats.skipped} câu.`);
      stats.errors.forEach((e) => console.warn('  Lỗi:', e));
    }
    if (args.includes('--tu-bai-hoc')) console.log(`Đã chép ${await lms.importLessonQuestions()} câu từ bài học.`);
    await lms.ensureBuiltinBlueprints();
  } catch (err) {
    console.error('Lỗi nạp ngân hàng:', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
