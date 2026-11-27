-- ============================================================================
-- CUSTOMER_DB - SCHEMA
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS customer_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE customer_db;

-- Hồ sơ khách hàng; user_id tham chiếu LOGIC sang auth_db.users.id
CREATE TABLE IF NOT EXISTS customers (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id    BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> auth_db.users.id',
    full_name  VARCHAR(150)    NOT NULL,
    birthday   DATE            DEFAULT NULL,
    gender     ENUM('MALE','FEMALE','OTHER') NOT NULL DEFAULT 'OTHER',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_customers_user (user_id),
    KEY idx_customers_name (full_name)
) ENGINE=InnoDB COMMENT='Hồ sơ khách hàng (1-1 với tài khoản Auth)';

-- Sổ địa chỉ nhận hàng
CREATE TABLE IF NOT EXISTS customer_addresses (
    id                     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id            BIGINT UNSIGNED NOT NULL,
    receiver_name          VARCHAR(150)    NOT NULL,
    phone                  VARCHAR(20)     NOT NULL,
    address                VARCHAR(500)    NOT NULL,
    is_default             BOOLEAN         NOT NULL DEFAULT FALSE,
    -- Cột sinh ra để đảm bảo mỗi khách hàng chỉ có tối đa 1 địa chỉ mặc định
    default_customer_id    BIGINT UNSIGNED GENERATED ALWAYS AS
                               (IF(is_default = TRUE, customer_id, NULL)) VIRTUAL,
    created_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_address_default (default_customer_id),
    KEY idx_addresses_customer (customer_id),
    CONSTRAINT fk_addresses_customer FOREIGN KEY (customer_id)
        REFERENCES customers (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Địa chỉ nhận hàng của khách';

-- Persistent test-drive bookings. Auth user IDs are logical references to auth_db.
CREATE TABLE IF NOT EXISTS test_drives (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id             BIGINT UNSIGNED DEFAULT NULL COMMENT 'Logic ref -> auth_db.users.id; NULL for guest bookings',
    code                VARCHAR(40)     NOT NULL,
    car_slug            VARCHAR(100)    NOT NULL,
    car_name            VARCHAR(150)    NOT NULL,
    showroom_id         VARCHAR(20)     NOT NULL,
    drive_date          DATE            NOT NULL,
    drive_time          TIME            NOT NULL,
    note                VARCHAR(1000)   DEFAULT NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    customer_full_name  VARCHAR(150)    NOT NULL,
    customer_phone      VARCHAR(20)     NOT NULL,
    customer_email      VARCHAR(254)    DEFAULT NULL,
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    active_slot_key     VARCHAR(150) GENERATED ALWAYS AS
                            (CASE WHEN status NOT IN ('CANCELLED', 'REJECTED')
                                  THEN CONCAT(car_slug, '|', showroom_id, '|', drive_date, '|', drive_time)
                                  ELSE NULL END) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uk_test_drives_code (code),
    UNIQUE KEY uk_test_drives_active_slot (active_slot_key),
    KEY idx_test_drives_user_created (user_id, created_at),
    KEY idx_test_drives_showroom_date (showroom_id, drive_date)
) ENGINE=InnoDB COMMENT='Persistent customer test-drive appointments';
