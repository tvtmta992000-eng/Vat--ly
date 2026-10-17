// Các cấp học cố định của website. Chương và bài học gắn với một cấp qua `slug`.
const LEVELS = [
  {
    slug: 'thcs',
    shortName: 'THCS',
    name: 'THCS',
    grades: 'Lớp 6 – 9',
    description: 'Nền tảng Khoa học tự nhiên: chuyển động, lực, ánh sáng, âm thanh, điện cơ bản.',
    icon: 'atom',
  },
  {
    slug: 'thpt',
    shortName: 'THPT',
    name: 'THPT',
    grades: 'Lớp 10 – 12',
    description: 'Động học, động lực học, dao động, sóng, điện từ và vật lý hạt nhân.',
    icon: 'wave',
  },
  {
    slug: 'on-thi',
    shortName: 'Ôn thi',
    name: 'Ôn thi ĐH & HSG',
    grades: 'Luyện đề nâng cao',
    description: 'Chuyên đề trọng tâm, bài tập vận dụng cao và đề luyện thi.',
    icon: 'target',
  },
  {
    slug: 'dai-cuong',
    shortName: 'Đại cương',
    name: 'Vật lý đại cương',
    grades: 'Sinh viên',
    description: 'Cơ học, nhiệt học, điện từ học và quang học cấp đại học.',
    icon: 'book',
  },
];

const bySlug = Object.fromEntries(LEVELS.map((l) => [l.slug, l]));

module.exports = { LEVELS, getLevel: (slug) => bySlug[slug] || null };
