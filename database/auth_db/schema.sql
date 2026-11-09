-- ============================================================================
-- AUTH_DB - SCHEMA
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS auth_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE auth_db;

-- Tài khoản đăng nhập
CREATE TABLE IF NOT EXISTS users (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email         VARCHAR(190)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    phone         VARCHAR(20)     DEFAULT NULL,
    status        ENUM('ACTIVE','INACTIVE','LOCKED') NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email),
    UNIQUE KEY uk_users_phone (phone),
    KEY idx_users_status (status)
) ENGINE=InnoDB COMMENT='Tài khoản đăng nhập của toàn hệ thống';

-- Quyền: CUSTOMER / ADMIN / STAFF
CREATE TABLE IF NOT EXISTS roles (
    id          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(30)      NOT NULL,
    description VARCHAR(255)     DEFAULT NULL,
    created_at  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_roles_name (name),
    CONSTRAINT chk_roles_name CHECK (name IN ('CUSTOMER','ADMIN','STAFF'))
) ENGINE=InnoDB COMMENT='Danh mục quyền';

-- Bảng trung gian N-N giữa users và roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT UNSIGNED  NOT NULL,
    role_id TINYINT UNSIGNED NOT NULL,
    PRIMARY KEY (user_id, role_id),
    KEY idx_user_roles_role (role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
        REFERENCES roles (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Gán quyền cho tài khoản (N-N)';
