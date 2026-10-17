const { migrate } = require('../src/schema');
const db = require('../src/db');

migrate()
  .then(() => console.log('Đã tạo/cập nhật các bảng cơ sở dữ liệu.'))
  .catch((err) => {
    console.error('Lỗi migrate:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
