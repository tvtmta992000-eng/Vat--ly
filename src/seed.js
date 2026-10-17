const bcrypt = require('bcryptjs');
const db = require('./db');
const config = require('./config');
const sampleContent = require('./seed-data');

async function ensureAdmin() {
  const { email, password, name } = config.admin;
  if (!email || !password) return false;
  const existing = await db.one('SELECT id FROM users WHERE email = ?', [email.toLowerCase()]);
  if (existing) return false;
  const hash = await bcrypt.hash(password, 12);
  await db.query('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)', [
    name,
    email.toLowerCase(),
    hash,
    'admin',
  ]);
  return true;
}

// Chỉ thêm nội dung mẫu khi chưa có chương nào, để không ghi đè nội dung thật.
async function seedSampleContent() {
  const { count } = await db.one('SELECT COUNT(*) AS count FROM chapters');
  if (count > 0) return false;

  for (const chapter of sampleContent) {
    const result = await db.query(
      'INSERT INTO chapters (level, title, description, position) VALUES (?, ?, ?, ?)',
      [chapter.level, chapter.title, chapter.description || null, chapter.position || 0]
    );
    const chapterId = result.insertId;

    for (const [lessonIndex, lesson] of chapter.lessons.entries()) {
      const lessonResult = await db.query(
        `INSERT INTO lessons (chapter_id, title, slug, summary, content_md, simulation, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [chapterId, lesson.title, lesson.slug, lesson.summary, lesson.content.trim(), lesson.simulation || null, lessonIndex]
      );
      for (const [qIndex, q] of (lesson.questions || []).entries()) {
        await db.query(
          `INSERT INTO questions (lesson_id, prompt_md, options_json, correct_index, explanation_md, position)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [lessonResult.insertId, q.prompt, JSON.stringify(q.options), q.answer, q.explanation || null, qIndex]
        );
      }
    }
  }
  return true;
}

module.exports = { ensureAdmin, seedSampleContent };
