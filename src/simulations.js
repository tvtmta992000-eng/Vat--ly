// Danh mục mô phỏng tương tác. `key` khớp với file public/js/sim-<key>.js
const SIMULATIONS = [
  {
    key: 'pendulum',
    title: 'Con lắc đơn',
    description: 'Thay đổi chiều dài dây, gia tốc trọng trường và biên độ để quan sát chu kì dao động.',
  },
  {
    key: 'projectile',
    title: 'Chuyển động ném xiên',
    description: 'Chọn vận tốc ban đầu và góc ném, xem quỹ đạo parabol, tầm xa và độ cao cực đại.',
  },
  {
    key: 'circuit',
    title: 'Định luật Ohm',
    description: 'Điều chỉnh suất điện động và các điện trở mắc nối tiếp/song song, đo cường độ dòng điện.',
  },
];

const byKey = Object.fromEntries(SIMULATIONS.map((s) => [s.key, s]));

module.exports = { SIMULATIONS, getSimulation: (key) => byKey[key] || null };
