// Danh mục mô phỏng tương tác. `key` khớp với views/sims/<key>.ejs và public/js/sim-<key>.js
const CATEGORIES = [
  { key: 'co-hoc', name: 'Cơ học & Động lực học' },
  { key: 'song-dao-dong', name: 'Sóng & Dao động' },
  { key: 'nhiet-hoc', name: 'Nhiệt học' },
  { key: 'dien-tu', name: 'Điện – Từ học' },
  { key: 'quang-hoc', name: 'Quang học' },
];

const SIMULATIONS = [
  {
    key: 'projectile',
    category: 'co-hoc',
    icon: 'projectile',
    title: 'Chuyển động ném xiên',
    description: 'Chọn vận tốc ban đầu và góc ném, xem quỹ đạo parabol, tầm xa và độ cao cực đại.',
    params: ['Vận tốc ban đầu', 'Góc ném', 'Gia tốc g'],
    applications: 'Đá bóng, ném tạ, bắn pháo hoa, vòi phun nước.',
  },
  {
    key: 'collision',
    category: 'co-hoc',
    icon: 'collision',
    title: 'Va chạm đàn hồi và mềm',
    description: 'Thay đổi khối lượng, vận tốc hai xe và hệ số phục hồi; so sánh động lượng, động năng trước và sau va chạm.',
    params: ['Khối lượng m₁, m₂', 'Vận tốc v₁, v₂', 'Kiểu va chạm'],
    applications: 'Va chạm bi-a, tai nạn giao thông, toa tàu móc nối.',
  },
  {
    key: 'incline',
    category: 'co-hoc',
    icon: 'incline',
    title: 'Mặt phẳng nghiêng và ma sát',
    description: 'Điều chỉnh góc nghiêng, khối lượng, hệ số ma sát nghỉ/trượt và lực kéo; quan sát các lực, gia tốc và quãng đường trượt.',
    params: ['Góc nghiêng', 'Khối lượng', 'Hệ số ma sát', 'Lực kéo'],
    applications: 'Xe lên dốc, băng chuyền hàng hoá, trượt patin, cầu trượt.',
  },
  {
    key: 'forces',
    category: 'co-hoc',
    icon: 'incline',
    title: 'Phân tích lực – 30 trường hợp',
    description:
      'Ba mươi tình huống phân tích lực kinh điển: ma sát, dây và ròng rọc, chuyển động tròn, hệ quy chiếu có gia tốc, cân bằng và momen, lò xo, lực đẩy Ác-si-mét và lực cản. Mỗi vectơ lực được vẽ theo đúng tỉ lệ độ lớn.',
    params: ['Khối lượng, góc, hệ số ma sát', 'Lực kéo, lực căng, gia tốc', 'Bán kính, tốc độ', 'Độ cứng lò xo, khối lượng riêng'],
    applications: 'Giải bài tập động lực học, kéo xe và đẩy thùng hàng, thang máy, xe vào cua, đòn bẩy, cân lò xo, tàu thuyền nổi trên nước.',
  },
  {
    key: 'pendulum',
    category: 'song-dao-dong',
    icon: 'pendulum',
    title: 'Con lắc đơn',
    description: 'Thay đổi chiều dài dây, gia tốc trọng trường và biên độ để quan sát chu kì dao động.',
    params: ['Chiều dài dây', 'Gia tốc g', 'Biên độ góc'],
    applications: 'Đồng hồ quả lắc, đo gia tốc trọng trường.',
  },
  {
    key: 'resonance',
    category: 'song-dao-dong',
    icon: 'resonance',
    title: 'Dao động cưỡng bức và cộng hưởng',
    description: 'Tác dụng ngoại lực tuần hoàn lên con lắc lò xo, thay đổi tần số cưỡng bức và lực cản để thấy biên độ tăng vọt khi cộng hưởng.',
    params: ['Tần số cưỡng bức', 'Tần số riêng', 'Lực cản'],
    applications: 'Rung lắc cầu, nhà cao tầng khi có gió hoặc động đất; giảm xóc ô tô.',
  },
  {
    key: 'interference',
    category: 'song-dao-dong',
    icon: 'interference',
    title: 'Giao thoa sóng trên mặt nước',
    description: 'Đặt một hoặc hai nguồn kết hợp, thay đổi tần số, biên độ và khoảng cách nguồn để quan sát vân cực đại, cực tiểu.',
    params: ['Số nguồn', 'Tần số', 'Khoảng cách hai nguồn', 'Biên độ'],
    applications: 'Sóng nước, giao thoa âm thanh, thí nghiệm Young với ánh sáng.',
  },
  {
    key: 'gas',
    category: 'nhiet-hoc',
    icon: 'gas',
    title: 'Mô hình khí lí tưởng',
    description: 'Các phân tử chuyển động hỗn loạn trong xi lanh có pít-tông; thay đổi nhiệt độ, thể tích, số phân tử và đo áp suất.',
    params: ['Nhiệt độ', 'Thể tích (pít-tông)', 'Số phân tử'],
    applications: 'Động cơ đốt trong, bơm xe đạp, nồi áp suất, bóng bay.',
  },
  {
    key: 'circuit',
    category: 'dien-tu',
    icon: 'zap',
    title: 'Định luật Ohm',
    description: 'Điều chỉnh suất điện động và các điện trở mắc nối tiếp/song song, đo cường độ dòng điện.',
    params: ['Suất điện động', 'Điện trở trong', 'R₁, R₂', 'Cách mắc'],
    applications: 'Mạch điện gia đình, pin và bóng đèn, sạc điện thoại.',
  },
  {
    key: 'induction',
    category: 'dien-tu',
    icon: 'magnet',
    title: 'Cảm ứng điện từ (Faraday – Lenz)',
    description: 'Kéo nam châm qua lại trong cuộn dây; quan sát kim điện kế, độ sáng bóng đèn và chiều dòng điện cảm ứng.',
    params: ['Vị trí, tốc độ nam châm', 'Số vòng dây', 'Chiều cực nam châm'],
    applications: 'Máy phát điện, bếp từ, phanh điện từ, sạc không dây.',
  },
  {
    key: 'lens',
    category: 'quang-hoc',
    icon: 'lens',
    title: 'Thấu kính mỏng',
    description: 'Đặt vật trước thấu kính hội tụ hoặc phân kì, thay đổi tiêu cự và khoảng cách để quan sát ảnh thật/ảo, lớn/nhỏ.',
    params: ['Loại thấu kính', 'Tiêu cự', 'Khoảng cách vật', 'Chiều cao vật'],
    applications: 'Máy ảnh, kính lúp, kính thiên văn, mắt cận và mắt viễn.',
  },
];

const byKey = Object.fromEntries(SIMULATIONS.map((s) => [s.key, s]));

function groupedSimulations() {
  return CATEGORIES.map((c) => ({ ...c, items: SIMULATIONS.filter((s) => s.category === c.key) })).filter(
    (c) => c.items.length > 0
  );
}

module.exports = { SIMULATIONS, CATEGORIES, groupedSimulations, getSimulation: (key) => byKey[key] || null };
