const db = require('./db');

const TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS chapters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    level VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    INDEX idx_chapters_level (level, position)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS lessons (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    summary VARCHAR(500) NULL,
    content_md MEDIUMTEXT NOT NULL,
    simulation VARCHAR(40) NULL,
    position INT NOT NULL DEFAULT 0,
    published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lessons_chapter (chapter_id, position),
    CONSTRAINT fk_lessons_chapter FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lesson_id INT UNSIGNED NOT NULL,
    prompt_md TEXT NOT NULL,
    options_json TEXT NOT NULL,
    correct_index TINYINT UNSIGNED NOT NULL,
    explanation_md TEXT NULL,
    position INT NOT NULL DEFAULT 0,
    INDEX idx_questions_lesson (lesson_id, position),
    CONSTRAINT fk_questions_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    lesson_id INT UNSIGNED NOT NULL,
    score INT NOT NULL,
    total INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_attempts_user (user_id, created_at),
    CONSTRAINT fk_attempts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS lesson_progress (
    user_id INT UNSIGNED NOT NULL,
    lesson_id INT UNSIGNED NOT NULL,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id),
    CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
  // ---------- Hệ thống quản trị học tập ----------
  `CREATE TABLE IF NOT EXISTS classes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code CHAR(6) NOT NULL UNIQUE,
    description VARCHAR(500) NULL,
    teacher_id INT UNSIGNED NOT NULL,
    archived TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_classes_teacher (teacher_id),
    CONSTRAINT fk_classes_teacher FOREIGN KEY (teacher_id) REFERENCES users(id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS class_members (
    class_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, user_id),
    INDEX idx_members_user (user_id),
    CONSTRAINT fk_members_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Ngân hàng câu hỏi. data_json theo dạng câu:
  //   mcq:   { options: [4 chuỗi], answer: 0..3 }
  //   tf:    { statements: [4 chuỗi], answers: [true/false ×4] }
  //   short: { answer: số, decimals: số chữ số thập phân, unit: chuỗi }
  // template_json (tuỳ chọn) cho biến thể số liệu: { vars: {ten: {min,max,step}}, answer: "biểu thức" }
  `CREATE TABLE IF NOT EXISTS bank_questions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    type ENUM('mcq', 'tf', 'short') NOT NULL,
    grade TINYINT UNSIGNED NOT NULL DEFAULT 12,
    topic VARCHAR(40) NOT NULL,
    difficulty TINYINT UNSIGNED NOT NULL DEFAULT 1,
    context_md TEXT NULL,
    stem_md TEXT NOT NULL,
    data_json TEXT NOT NULL,
    explanation_md TEXT NULL,
    template_json TEXT NULL,
    source VARCHAR(200) NULL,
    source_key VARCHAR(80) NULL UNIQUE,
    family VARCHAR(80) NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bank_family (family),
    INDEX idx_bank_lookup (type, grade, topic, difficulty),
    CONSTRAINT fk_bank_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Khung đề (cấu trúc, dạng câu, mức độ, thang điểm) — lấy từ đề mẫu hoặc tạo tay.
  `CREATE TABLE IF NOT EXISTS blueprints (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    kind ENUM('practice', 'test', 'exam') NOT NULL DEFAULT 'exam',
    duration_min INT UNSIGNED NULL,
    structure_json TEXT NOT NULL,
    source_note VARCHAR(300) NULL,
    source_key VARCHAR(80) NULL UNIQUE,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_blueprint_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS exams (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    kind ENUM('practice', 'test', 'exam') NOT NULL DEFAULT 'test',
    description TEXT NULL,
    duration_min INT UNSIGNED NULL,
    blueprint_id INT UNSIGNED NULL,
    auto_generated TINYINT(1) NOT NULL DEFAULT 0,
    -- 1 = đề luyện tập cá nhân do hệ thống tạo cho một học viên (ẩn khỏi danh sách đề của giáo viên)
    is_personal TINYINT(1) NOT NULL DEFAULT 0,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_exam_blueprint FOREIGN KEY (blueprint_id) REFERENCES blueprints(id) ON DELETE SET NULL,
    CONSTRAINT fk_exam_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Câu hỏi trong đề lưu bản chụp (snapshot) nên sửa ngân hàng không làm đổi đề đã giao.
  `CREATE TABLE IF NOT EXISTS exam_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exam_id INT UNSIGNED NOT NULL,
    position INT NOT NULL,
    part TINYINT UNSIGNED NOT NULL DEFAULT 1,
    points DECIMAL(5,2) NOT NULL,
    bank_question_id INT UNSIGNED NULL,
    type ENUM('mcq', 'tf', 'short') NOT NULL,
    topic VARCHAR(40) NOT NULL,
    difficulty TINYINT UNSIGNED NOT NULL,
    context_md TEXT NULL,
    stem_md TEXT NOT NULL,
    data_json TEXT NOT NULL,
    explanation_md TEXT NULL,
    INDEX idx_items_exam (exam_id, position),
    CONSTRAINT fk_items_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_items_bank FOREIGN KEY (bank_question_id) REFERENCES bank_questions(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS assignments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    exam_id INT UNSIGNED NOT NULL,
    class_id INT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    instructions TEXT NULL,
    open_at DATETIME NULL,
    due_at DATETIME NULL,
    duration_min INT UNSIGNED NULL,
    max_attempts INT UNSIGNED NOT NULL DEFAULT 1,
    score_policy ENUM('best', 'last') NOT NULL DEFAULT 'best',
    show_answers ENUM('after_submit', 'after_due', 'never') NOT NULL DEFAULT 'after_submit',
    auto_practice TINYINT(1) NOT NULL DEFAULT 1,
    is_auto_practice TINYINT(1) NOT NULL DEFAULT 0,
    source_attempt_id INT UNSIGNED NULL,
    created_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_assign_class (class_id),
    CONSTRAINT fk_assign_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    CONSTRAINT fk_assign_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Giao riêng cho từng học viên (ngoài/hoặc thay cho cả lớp)
  `CREATE TABLE IF NOT EXISTS assignment_targets (
    assignment_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    PRIMARY KEY (assignment_id, user_id),
    INDEX idx_targets_user (user_id),
    CONSTRAINT fk_targets_assign FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_targets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    assignment_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    started_at DATETIME NOT NULL,
    deadline_at DATETIME NULL,
    submitted_at DATETIME NULL,
    status ENUM('in_progress', 'submitted') NOT NULL DEFAULT 'in_progress',
    is_late TINYINT(1) NOT NULL DEFAULT 0,
    answers_json MEDIUMTEXT NULL,
    score DECIMAL(6,2) NULL,
    max_score DECIMAL(6,2) NULL,
    adjusted TINYINT(1) NOT NULL DEFAULT 0,
    analysis_json MEDIUMTEXT NULL,
    INDEX idx_attempts_assign_user (assignment_id, user_id),
    INDEX idx_attempts_user (user_id, submitted_at),
    CONSTRAINT fk_attempts2_assign FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts2_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS attempt_items (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT UNSIGNED NOT NULL,
    exam_item_id INT UNSIGNED NOT NULL,
    response_json TEXT NULL,
    auto_points DECIMAL(5,2) NOT NULL DEFAULT 0,
    override_points DECIMAL(5,2) NULL,
    max_points DECIMAL(5,2) NOT NULL,
    correct_parts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    total_parts TINYINT UNSIGNED NOT NULL DEFAULT 1,
    UNIQUE KEY uq_attempt_item (attempt_id, exam_item_id),
    INDEX idx_attempt_items_item (exam_item_id),
    CONSTRAINT fk_ai_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_ai_item FOREIGN KEY (exam_item_id) REFERENCES exam_items(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Lịch sử chỉnh điểm (không bao giờ xoá)
  `CREATE TABLE IF NOT EXISTS grade_audit (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT UNSIGNED NOT NULL,
    attempt_item_id INT UNSIGNED NULL,
    changed_by INT UNSIGNED NULL,
    old_points DECIMAL(6,2) NULL,
    new_points DECIMAL(6,2) NULL,
    reason VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_attempt (attempt_id),
    CONSTRAINT fk_audit_attempt FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Đề mẫu đã tải lên (giữ văn bản trích xuất để phân tích lại khi cần)
  `CREATE TABLE IF NOT EXISTS sample_uploads (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    extracted_text MEDIUMTEXT NOT NULL,
    analysis_json MEDIUMTEXT NULL,
    uploaded_by INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_upload_user FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Nhật ký chỉnh sửa (ngân hàng câu hỏi, đề, bài giao) — chỉ thêm, không sửa/xoá
  `CREATE TABLE IF NOT EXISTS edit_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    entity VARCHAR(30) NOT NULL,
    entity_id INT UNSIGNED NOT NULL,
    action VARCHAR(30) NOT NULL,
    detail_json MEDIUMTEXT NULL,
    user_id INT UNSIGNED NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_edit_entity (entity, entity_id),
    CONSTRAINT fk_edit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

async function migrate() {
  for (const sql of TABLES) {
    await db.query(sql);
  }
}

module.exports = { migrate };
