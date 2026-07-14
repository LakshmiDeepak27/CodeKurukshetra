CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  provider ENUM('password', 'google') NOT NULL DEFAULT 'password',
  google_sub VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_google_sub (google_sub)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS problems (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  statement TEXT NOT NULL,
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Easy',
  sample_input TEXT NULL,
  sample_output TEXT NULL,
  time_limit_ms INT UNSIGNED NOT NULL DEFAULT 1000,
  memory_limit_mb INT UNSIGNED NOT NULL DEFAULT 256,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS problem_tags (
  problem_id VARCHAR(64) NOT NULL,
  tag VARCHAR(64) NOT NULL,
  PRIMARY KEY (problem_id, tag),
  CONSTRAINT fk_problem_tags_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS problem_constraints (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id VARCHAR(64) NOT NULL,
  constraint_text VARCHAR(512) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_problem_constraints_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
  KEY idx_problem_constraints_problem (problem_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_cases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id VARCHAR(64) NOT NULL,
  input_text TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample TINYINT(1) NOT NULL DEFAULT 0,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_test_cases_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
  KEY idx_test_cases_problem (problem_id, is_sample, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  problem_id VARCHAR(64) NOT NULL,
  code MEDIUMTEXT NOT NULL,
  language VARCHAR(32) NOT NULL DEFAULT 'cpp',
  mode ENUM('run', 'submit') NOT NULL DEFAULT 'submit',
  verdict VARCHAR(64) NULL,
  status ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_submissions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_submissions_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE,
  KEY idx_submissions_user (user_id, created_at),
  KEY idx_submissions_problem (problem_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submission_results (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  submission_id CHAR(36) NOT NULL,
  test_case_id INT UNSIGNED NULL,
  case_index INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  input_text TEXT NULL,
  expected_output TEXT NULL,
  actual_output TEXT NULL,
  runtime_ms INT UNSIGNED NULL,
  CONSTRAINT fk_submission_results_submission FOREIGN KEY (submission_id) REFERENCES submissions (id) ON DELETE CASCADE,
  CONSTRAINT fk_submission_results_test_case FOREIGN KEY (test_case_id) REFERENCES test_cases (id) ON DELETE SET NULL,
  KEY idx_submission_results_submission (submission_id, case_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
