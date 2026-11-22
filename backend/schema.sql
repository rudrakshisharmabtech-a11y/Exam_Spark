CREATE DATABASE IF NOT EXISTS examspark
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE examspark;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  status ENUM('active', 'inactive', 'suspended') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS student_profiles (
  roll_number VARCHAR(32) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  section VARCHAR(32) NOT NULL,
  github_profile VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (roll_number),
  UNIQUE KEY uq_student_user (user_id),
  CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider ENUM('google', 'github') NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE KEY uq_oauth_user_provider (user_id, provider),
  CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  code VARCHAR(32) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  total_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'draft',
  starts_at DATETIME NULL,
  ends_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_exam_code_owner (owner_user_id, code),
  KEY idx_exam_status_schedule (status, starts_at, ends_at),
  CONSTRAINT fk_exam_owner FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id BIGINT UNSIGNED NOT NULL,
  topic VARCHAR(120) NOT NULL,
  difficulty ENUM('easy', 'moderate', 'difficult') NOT NULL DEFAULT 'moderate',
  prompt TEXT NOT NULL,
  options JSON NOT NULL,
  correct_option TINYINT UNSIGNED NOT NULL,
  explanation TEXT NULL,
  points DECIMAL(6,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_question_exam (exam_id),
  CONSTRAINT fk_question_exam FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  exam_id BIGINT UNSIGNED NOT NULL,
  student_roll_number VARCHAR(32) NOT NULL,
  started_at DATETIME NOT NULL,
  expires_at DATETIME NOT NULL,
  submitted_at DATETIME NULL,
  score DECIMAL(8,2) NULL,
  percentage DECIMAL(5,2) NULL,
  status ENUM('in_progress', 'submitted', 'expired') NOT NULL DEFAULT 'in_progress',
  PRIMARY KEY (id),
  KEY idx_attempt_student_exam (student_roll_number, exam_id),
  KEY idx_attempt_exam_status (exam_id, status),
  CONSTRAINT fk_attempt_exam FOREIGN KEY (exam_id) REFERENCES exams (id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_student FOREIGN KEY (student_roll_number) REFERENCES student_profiles (roll_number) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempt_questions (
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  question_order SMALLINT UNSIGNED NOT NULL,
  selected_option TINYINT UNSIGNED NULL,
  confidence ENUM('sure', 'unsure', 'guessed') NULL,
  flagged_for_review BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (attempt_id, question_id),
  UNIQUE KEY uq_attempt_question_order (attempt_id, question_order),
  CONSTRAINT fk_attempt_question_attempt FOREIGN KEY (attempt_id) REFERENCES attempts (id) ON DELETE CASCADE,
  CONSTRAINT fk_attempt_question_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attempt_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  attempt_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('tab_switch', 'visibility_change') NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_attempt_event (attempt_id),
  CONSTRAINT fk_attempt_event_attempt FOREIGN KEY (attempt_id) REFERENCES attempts (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assignments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  teacher_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  subject VARCHAR(80) NOT NULL,
  section VARCHAR(32) NULL,
  description TEXT NULL,
  due_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_assignment_section_due (section, due_at),
  CONSTRAINT fk_assignment_teacher FOREIGN KEY (teacher_user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS assignment_submissions (
  assignment_id BIGINT UNSIGNED NOT NULL,
  student_roll_number VARCHAR(32) NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assignment_id, student_roll_number),
  CONSTRAINT fk_assignment_submission_assignment FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE,
  CONSTRAINT fk_assignment_submission_student FOREIGN KEY (student_roll_number) REFERENCES student_profiles (roll_number) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_resources (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject VARCHAR(80) NOT NULL,
  topic VARCHAR(120) NOT NULL,
  title VARCHAR(180) NOT NULL,
  platform VARCHAR(80) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_study_resource_subject (subject)
) ENGINE=InnoDB;
