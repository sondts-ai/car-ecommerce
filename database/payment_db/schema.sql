-- ============================================================================
-- PAYMENT_DB - SCHEMA
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS payment_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE payment_db;

-- Một đơn hàng có thể có nhiều lần thanh toán (cọc, phần còn lại...)
CREATE TABLE IF NOT EXISTS payments (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id     BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> order_db.orders.id',
    payment_type ENUM('DEPOSIT','REMAINING') NOT NULL,
    amount       DECIMAL(15,2)   NOT NULL,
    status       ENUM('PENDING','PROCESSING','PAID','FAILED','CANCELLED','REFUNDED')
                                 NOT NULL DEFAULT 'PENDING',
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_payments_order (order_id, payment_type),
    KEY idx_payments_status (status),
    CONSTRAINT chk_payments_amount CHECK (amount > 0)
) ENGINE=InnoDB COMMENT='Các lần thanh toán của đơn hàng';

-- Một lần thanh toán có thể có nhiều giao dịch thử lại
CREATE TABLE IF NOT EXISTS payment_transactions (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id         BIGINT UNSIGNED NOT NULL,
    transaction_code   VARCHAR(100)    NOT NULL COMMENT 'Mã giao dịch từ cổng thanh toán',
    gateway            ENUM('VNPAY','MOMO','ZALOPAY','BANK_TRANSFER','CASH','OTHER')
                                       NOT NULL,
    response_code      VARCHAR(20)     DEFAULT NULL,
    transaction_status ENUM('PENDING','SUCCESS','FAILED','TIMEOUT') NOT NULL DEFAULT 'PENDING',
    amount             DECIMAL(15,2)   DEFAULT NULL COMMENT 'Số tiền cổng xác nhận',
    paid_at            DATETIME        DEFAULT NULL,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_transactions_code (transaction_code),
    KEY idx_transactions_payment (payment_id, created_at),
    KEY idx_transactions_status (transaction_status),
    CONSTRAINT fk_transactions_payment FOREIGN KEY (payment_id)
        REFERENCES payments (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Từng giao dịch gửi tới cổng thanh toán (có thể retry)';

CREATE TABLE IF NOT EXISTS refunds (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    amount     DECIMAL(15,2)   NOT NULL,
    reason     VARCHAR(500)    DEFAULT NULL,
    status     ENUM('PENDING','APPROVED','REJECTED','COMPLETED')
                               NOT NULL DEFAULT 'PENDING',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_refunds_payment (payment_id),
    KEY idx_refunds_status (status),
    CONSTRAINT fk_refunds_payment FOREIGN KEY (payment_id)
        REFERENCES payments (id) ON DELETE CASCADE,
    CONSTRAINT chk_refunds_amount CHECK (amount > 0)
) ENGINE=InnoDB COMMENT='Hoàn tiền cho khách';
