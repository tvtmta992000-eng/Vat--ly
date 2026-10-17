// Nhập nội dung bài học từ một file trong thư mục content/.
//   npm run import -- content/vat-ly-12.js              thêm bài mới
//   npm run import -- content/vat-ly-12.js --xoa-bai-mau  đồng thời xoá 6 bài mẫu ban đầu
const path = require('node:path');
const { migrate } = require('../src/schema');
const { importChapters, removeLessons, sampleLessonSlugs } = require('../src/seed');
const { getLevel } = require('../src/levels');
const db = require('../src/db');

(async () => {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith('--'));
  if (!file) {
    console.error('Cách dùng: npm run import -- content/<ten-file>.js [--xoa-bai-mau]');
    process.exitCode = 1;
    return db.pool.end();
  }
  try {
    const chapters = require(path.resolve(file));
    const badLevel = chapters.find((c) => !getLevel(c.level));
    if (badLevel) throw new Error(`Cấp học không hợp lệ: "${badLevel.level}" (chương "${badLevel.title}")`);

    await migrate();
    if (args.includes('--xoa-bai-mau')) {
      console.log(`Đã xoá ${await removeLessons(sampleLessonSlugs())} bài mẫu.`);
    }
    const stats = await importChapters(chapters);
    console.log(`Đã thêm ${stats.chapters} chương, ${stats.lessons} bài học, ${stats.questions} câu hỏi.`);
    if (stats.skipped.length) console.log(`Bỏ qua ${stats.skipped.length} bài đã có: ${stats.skipped.join(', ')}`);
  } catch (err) {
    console.error('Lỗi nhập nội dung:', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
