// Bản đồ chủ đề kiến thức dùng cho ngân hàng câu hỏi, phân tích kết quả và đề xuất ôn tập.
// keywords: dùng để tự nhận diện chủ đề khi nhập đề mẫu (không phân biệt hoa thường, có dấu).
const TOPICS = [
  {
    key: 'vl10-c1', grade: 10, name: 'Đơn vị và sai số',
    keywords: ['sai số', 'thứ nguyên', 'đơn vị cơ bản', 'phép đo', 'giá trị trung bình', 'độ chia nhỏ nhất'],
    lessons: ['vl10-c1-sai-so-kien-thuc', 'vl10-c1-sai-so-dang-bai'],
    tip: 'Ôn quy tắc: tổng/hiệu cộng sai số tuyệt đối, tích/thương cộng sai số tỉ đối, luỹ thừa nhân với số mũ. Làm tròn sai số về 1 chữ số có nghĩa.',
  },
  {
    key: 'vl10-c2', grade: 10, name: 'Động học',
    keywords: ['độ dịch chuyển', 'gia tốc', 'rơi tự do', 'ném ngang', 'ném xiên', 'vận tốc trung bình', 'chuyển động thẳng', 'đồ thị vận tốc', 'quãng đường'],
    lessons: ['vl10-c2-dong-hoc-kien-thuc', 'vl10-c2-dong-hoc-dang-bai'], simulation: 'projectile',
    tip: 'Luôn chọn chiều dương trước khi thay số; đổi km/h sang m/s; với ném ngang tách hai chuyển động theo Ox và Oy.',
  },
  {
    key: 'vl10-c3', grade: 10, name: 'Động lực học',
    keywords: ['định luật newton', 'định luật i', 'định luật ii', 'định luật iii', 'ma sát', 'mặt phẳng nghiêng', 'moment', 'momen', 'lực căng', 'ròng rọc', 'hợp lực'],
    lessons: ['vl10-c3-dong-luc-hoc-kien-thuc', 'vl10-c3-dong-luc-hoc-dang-bai'], simulation: 'incline',
    tip: 'Vẽ đủ các lực, chọn trục theo chiều chuyển động, viết định luật II cho từng vật rồi mới giải hệ.',
  },
  {
    key: 'vl10-c4', grade: 10, name: 'Công, năng lượng, công suất',
    keywords: ['công suất', 'động năng', 'thế năng', 'cơ năng', 'hiệu suất', 'công của lực', 'định lí động năng'],
    lessons: ['vl10-c4-nang-luong-kien-thuc', 'vl10-c4-nang-luong-dang-bai'],
    tip: 'Xác định đúng góc giữa lực và độ dịch chuyển; với bài có ma sát dùng định lí động năng thay cho bảo toàn cơ năng.',
  },
  {
    key: 'vl10-c5', grade: 10, name: 'Động lượng',
    keywords: ['động lượng', 'xung lượng', 'va chạm', 'súng giật', 'phản lực', 'bảo toàn động lượng'],
    lessons: ['vl10-c5-dong-luong-kien-thuc', 'vl10-c5-dong-luong-dang-bai'], simulation: 'collision',
    tip: 'Động lượng là vectơ: chọn chiều dương và giữ đúng dấu vận tốc. Va chạm mềm mất động năng, va chạm đàn hồi thì không.',
  },
  {
    key: 'vl10-c6', grade: 10, name: 'Chuyển động tròn',
    keywords: ['chuyển động tròn', 'tốc độ góc', 'hướng tâm', 'chu kì quay', 'qua cầu', 'qua cua'],
    lessons: ['vl10-c6-chuyen-dong-tron-kien-thuc', 'vl10-c6-chuyen-dong-tron-dang-bai'],
    tip: 'Lực hướng tâm không phải lực mới: xác định lực nào (ma sát, lực căng, trọng lực…) đóng vai trò hướng tâm.',
  },
  {
    key: 'vl10-c7', grade: 10, name: 'Biến dạng vật rắn',
    keywords: ['lò xo', 'hooke', 'độ cứng', 'ứng suất', 'suất young', 'biến dạng'],
    lessons: ['vl10-c7-bien-dang-kien-thuc', 'vl10-c7-bien-dang-dang-bai'],
    tip: 'Đổi cm sang m và mm² sang m² trước khi thay số; nhớ ghép nối tiếp/song song của lò xo ngược với điện trở.',
  },
  {
    key: 'vl11-c1', grade: 11, name: 'Dao động',
    keywords: ['dao động', 'con lắc', 'biên độ', 'pha ban đầu', 'cộng hưởng', 'tần số góc', 'li độ'],
    lessons: ['vl11-c1-dao-dong-kien-thuc', 'vl11-c1-dao-dong-dang-bai'], simulation: 'resonance',
    tip: 'Thuộc hệ thức độc lập A² = x² + v²/ω² và dùng vòng tròn lượng giác cho bài thời gian.',
  },
  {
    key: 'vl11-c2', grade: 11, name: 'Sóng',
    keywords: ['sóng', 'bước sóng', 'giao thoa', 'sóng dừng', 'bụng sóng', 'nút sóng', 'sóng điện từ'],
    lessons: ['vl11-c2-song-kien-thuc', 'vl11-c2-song-dang-bai'], simulation: 'interference',
    tip: 'Nắm điều kiện cực đại/cực tiểu theo hiệu đường đi và điều kiện sóng dừng l = nλ/2.',
  },
  {
    key: 'vl11-c3', grade: 11, name: 'Trường điện',
    keywords: ['điện tích', 'coulomb', 'cu-lông', 'điện trường', 'điện thế', 'tụ điện', 'điện dung'],
    lessons: ['vl11-c3-truong-dien-kien-thuc', 'vl11-c3-truong-dien-dang-bai'],
    tip: 'Đổi μC, nC sang C và cm sang m; nhớ lực Coulomb tỉ lệ nghịch với bình phương khoảng cách.',
  },
  {
    key: 'vl11-c4', grade: 11, name: 'Dòng điện, mạch điện',
    keywords: ['điện trở', 'định luật ôm', 'định luật ohm', 'suất điện động', 'nguồn điện', 'mạch điện', 'cường độ dòng điện', 'điện năng'],
    lessons: ['vl11-c4-mach-dien-kien-thuc', 'vl11-c4-mach-dien-dang-bai'], simulation: 'circuit',
    tip: 'Rút gọn mạch từ trong ra ngoài; nhớ U = ξ − Ir và công suất cực đại khi R = r.',
  },
  {
    key: 'vl12-c1', grade: 12, name: 'Vật lí nhiệt',
    keywords: ['nhiệt lượng', 'nhiệt dung riêng', 'nội năng', 'nóng chảy', 'hoá hơi', 'hóa hơi', 'sôi', 'đông đặc', 'nhiệt độ', 'thể lỏng', 'thể rắn', 'thể khí', 'chuyển thể', 'tiếp xúc nhiệt', 'truyền nhiệt', 'định luật i nhiệt động'],
    lessons: ['vl12-c1-vat-li-nhiet-kien-thuc', 'vl12-c1-vat-li-nhiet-dang-bai'],
    tip: 'Phân biệt nhiệt lượng (năng lượng truyền đi) với nội năng (vật "chứa"); nhớ quy ước dấu trong ΔU = A + Q.',
  },
  {
    key: 'vl12-c2', grade: 12, name: 'Khí lí tưởng',
    keywords: ['khí lí tưởng', 'đẳng nhiệt', 'đẳng áp', 'đẳng tích', 'boyle', 'charles', 'clapeyron', 'áp suất khí', 'phân tử khí', 'xilanh', 'pit-tông', 'pít-tông', 'lốp xe'],
    lessons: ['vl12-c2-khi-li-tuong-kien-thuc', 'vl12-c2-khi-li-tuong-dang-bai'], simulation: 'gas',
    tip: 'Luôn đổi nhiệt độ sang kelvin; xác định thông số nào không đổi trước khi chọn định luật.',
  },
  {
    key: 'vl12-c3', grade: 12, name: 'Từ trường và cảm ứng điện từ',
    keywords: ['từ trường', 'lực từ', 'cảm ứng từ', 'từ thông', 'cảm ứng điện từ', 'lenz', 'nam châm', 'xoay chiều', 'máy biến áp', 'thanh kim loại', 'suất điện động cảm ứng', 'dòng điện cảm ứng'],
    lessons: ['vl12-c3-tu-truong-kien-thuc', 'vl12-c3-tu-truong-dang-bai'], simulation: 'induction',
    tip: 'Xác định góc giữa dây và B cho lực từ; với cảm ứng điện từ dùng |e| = N|ΔΦ|/Δt hoặc e = Blv và định luật Lenz cho chiều.',
  },
  {
    key: 'vl12-c4', grade: 12, name: 'Vật lí hạt nhân và phóng xạ',
    keywords: ['hạt nhân', 'phóng xạ', 'bán rã', 'nucleon', 'độ hụt khối', 'năng lượng liên kết', 'đồng vị', 'phân rã', 'rutherford', 'alpha', 'nguyên tử'],
    lessons: ['vl12-c4-hat-nhan-kien-thuc', 'vl12-c4-hat-nhan-dang-bai'],
    tip: 'Độ bền xét theo năng lượng liên kết riêng; với phóng xạ tính t/T trước rồi mới dùng 2^(−t/T).',
  },
];

const DIFFICULTIES = { 1: 'Nhận biết', 2: 'Thông hiểu', 3: 'Vận dụng' };
const TYPES = { mcq: 'Trắc nghiệm', tf: 'Đúng/Sai', short: 'Trả lời ngắn' };

const byKey = Object.fromEntries(TOPICS.map((t) => [t.key, t]));

function getTopic(key) {
  return byKey[key] || { key, grade: 12, name: key, keywords: [], lessons: [], tip: '' };
}

// Chọn chủ đề có nhiều từ khoá khớp nhất; ưu tiên khớp cụm dài. preferGrade dùng khi hoà điểm.
function classifyTopic(text, preferGrade = null) {
  const lower = String(text || '').toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    let score = 0;
    for (const kw of topic.keywords) {
      if (lower.includes(kw)) score += kw.length;
    }
    if (preferGrade && topic.grade === preferGrade) score += score > 0 ? 0.5 : 0;
    if (score > bestScore) {
      best = topic;
      bestScore = score;
    }
  }
  return best ? best.key : null;
}

module.exports = { TOPICS, DIFFICULTIES, TYPES, getTopic, classifyTopic };
