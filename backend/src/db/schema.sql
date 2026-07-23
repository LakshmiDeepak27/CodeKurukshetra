CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NULL,
  provider ENUM('password', 'google') NOT NULL DEFAULT 'password',
  google_sub VARCHAR(255) NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  bio VARCHAR(512) NULL,
  institution VARCHAR(255) NULL,
  preferred_language VARCHAR(32) NOT NULL DEFAULT 'cpp',
  avatar_url VARCHAR(512) NULL,
  battle_rating INT UNSIGNED NOT NULL DEFAULT 1200,
  last_seen_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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

-- The execution contract is data, not application code.  A problem can be
-- stdin/stdout based (no row) or function based (one row with language JSON).
CREATE TABLE IF NOT EXISTS problem_function_metadata (
  problem_id VARCHAR(64) PRIMARY KEY,
  function_name VARCHAR(128) NOT NULL,
  return_type VARCHAR(255) NOT NULL,
  parameters_json JSON NOT NULL,
  languages_json JSON NOT NULL,
  CONSTRAINT fk_problem_function_metadata_problem FOREIGN KEY (problem_id) REFERENCES problems (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NULL,
  problem_id VARCHAR(64) NOT NULL,
  battle_id CHAR(36) NULL,
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

CREATE TABLE IF NOT EXISTS problem_votes (
  problem_id VARCHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  vote_type ENUM('like','dislike') NOT NULL,
  PRIMARY KEY (problem_id, user_id),
  CONSTRAINT fk_votes_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT fk_votes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS problem_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id VARCHAR(64) NOT NULL,
  user_id CHAR(36) NOT NULL,
  text VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_problem FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS battles (
  id CHAR(36) PRIMARY KEY,
  room_code VARCHAR(12) NOT NULL UNIQUE,
  topic VARCHAR(64) NOT NULL,
  problem_id VARCHAR(64) NOT NULL,
  status ENUM('waiting','active','finished','abandoned') NOT NULL DEFAULT 'waiting',
  time_limit_seconds INT UNSIGNED NOT NULL DEFAULT 900,
  started_at TIMESTAMP NULL,
  ended_at TIMESTAMP NULL,
  winner_user_id CHAR(36) NULL,
  win_reason ENUM(
    'first_accepted',
    'better_time_complexity',
    'better_space_complexity',
    'faster_runtime',
    'opponent_forfeit',
    'draw'
  ) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_battles_problem FOREIGN KEY (problem_id) REFERENCES problems(id),
  CONSTRAINT fk_battles_winner FOREIGN KEY (winner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS battle_players (
  battle_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  best_submission_id CHAR(36) NULL,
  first_accepted_at TIMESTAMP NULL,
  time_complexity_estimate VARCHAR(32) NULL,
  space_complexity_estimate VARCHAR(32) NULL,
  total_runtime_ms INT UNSIGNED NULL,
  peak_memory_kb INT UNSIGNED NULL,
  status ENUM('active','disconnected','forfeited') NOT NULL DEFAULT 'active',
  PRIMARY KEY (battle_id, user_id),
  CONSTRAINT fk_bp_battle FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE,
  CONSTRAINT fk_bp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS battle_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  battle_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  event_type VARCHAR(32) NOT NULL,
  payload_json JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_be_battle FOREIGN KEY (battle_id) REFERENCES battles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

