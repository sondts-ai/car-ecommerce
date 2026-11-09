-- ============================================================================
-- ORDER_DB - SCHEMA
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS order_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE order_db;

-- Giỏ hàng; customer_id tham chiếu LOGIC sang customer_db.customers.id
CREATE TABLE IF NOT EXISTS carts (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_id        BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> customer_db.customers.id',
    status             ENUM('ACTIVE','CHECKED_OUT','ABANDONED') NOT NULL DEFAULT 'ACTIVE',
    -- Mỗi khách hàng chỉ có 1 giỏ đang hoạt động
    active_customer_id BIGINT UNSIGNED GENERATED ALWAYS AS
                           (IF(status = 'ACTIVE', customer_id, NULL)) STORED,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_carts_active_customer (active_customer_id),
    KEY idx_carts_customer (customer_id),
    CONSTRAINT chk_carts_status CHECK (status IN ('ACTIVE','CHECKED_OUT','ABANDONED'))
) ENGINE=InnoDB COMMENT='Giỏ hàng của khách';

CREATE TABLE IF NOT EXISTS cart_items (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    cart_id    BIGINT UNSIGNED NOT NULL,
    vehicle_id BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> vehicle_db.vehicles.id',
    added_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_cart_items (cart_id, vehicle_id),
    KEY idx_cart_items_vehicle (vehicle_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id)
        REFERENCES carts (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Xe trong giỏ hàng';

CREATE TABLE IF NOT EXISTS orders (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_code      VARCHAR(30)     NOT NULL,
    customer_id     BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> customer_db.customers.id',
    subtotal        DECIMAL(15,2)   NOT NULL DEFAULT 0,
    total_amount    DECIMAL(15,2)   NOT NULL DEFAULT 0,
    deposit_amount  DECIMAL(15,2)   NOT NULL DEFAULT 0,
    remaining_amount DECIMAL(15,2)  NOT NULL DEFAULT 0,
    status          ENUM('PENDING_DEPOSIT','DEPOSIT_PAID','CONFIRMED',
                         'WAITING_REMAINING_PAYMENT','COMPLETED',
                         'CANCELLED','EXPIRED','REFUNDED')
                                    NOT NULL DEFAULT 'PENDING_DEPOSIT',
    reserved_until  DATETIME        DEFAULT NULL COMMENT 'Hạn giữ xe chờ đặt cọc',
    note            VARCHAR(500)    DEFAULT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_orders_code (order_code),
    KEY idx_orders_customer (customer_id, created_at),
    KEY idx_orders_status (status),
    CONSTRAINT chk_orders_amount CHECK (subtotal >= 0 AND total_amount >= 0
                                        AND deposit_amount >= 0 AND remaining_amount >= 0)
) ENGINE=InnoDB COMMENT='Đơn hàng mua xe';

-- Snapshot thông tin xe + giá tại thời điểm đặt hàng
CREATE TABLE IF NOT EXISTS order_items (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id     BIGINT UNSIGNED NOT NULL,
    vehicle_id   BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> vehicle_db.vehicles.id',
    vehicle_name VARCHAR(255)    NOT NULL COMMENT 'Snapshot tên dòng xe / phiên bản',
    vin          VARCHAR(17)     NOT NULL COMMENT 'Snapshot số khung',
    price        DECIMAL(15,2)   NOT NULL COMMENT 'Snapshot giá tại thời điểm đặt',
    PRIMARY KEY (id),
    UNIQUE KEY uk_order_items (order_id, vehicle_id),
    KEY idx_order_items_vehicle (vehicle_id),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT chk_order_items_price CHECK (price >= 0)
) ENGINE=InnoDB COMMENT='Chi tiết đơn hàng (snapshot)';

CREATE TABLE IF NOT EXISTS order_status_history (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id    BIGINT UNSIGNED NOT NULL,
    old_status  ENUM('PENDING_DEPOSIT','DEPOSIT_PAID','CONFIRMED',
                     'WAITING_REMAINING_PAYMENT','COMPLETED',
                     'CANCELLED','EXPIRED','REFUNDED') DEFAULT NULL,
    new_status  ENUM('PENDING_DEPOSIT','DEPOSIT_PAID','CONFIRMED',
                     'WAITING_REMAINING_PAYMENT','COMPLETED',
                     'CANCELLED','EXPIRED','REFUNDED') NOT NULL,
    note        VARCHAR(500)    DEFAULT NULL,
    changed_by  BIGINT UNSIGNED DEFAULT NULL COMMENT 'Logic ref -> auth_db.users.id',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_order_status_history_order (order_id, created_at),
    CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch sử trạng thái đơn hàng';

-- Cơ chế giữ xe: mỗi chiếc xe chỉ có tối đa 1 reservation đang ACTIVE
-- (đảm bảo không 2 đơn hàng cùng giữ / mua thành công 1 chiếc xe)
CREATE TABLE IF NOT EXISTS vehicle_reservations (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id         BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> vehicle_db.vehicles.id',
    order_id           BIGINT UNSIGNED NOT NULL,
    customer_id        BIGINT UNSIGNED NOT NULL COMMENT 'Logic ref -> customer_db.customers.id',
    status             ENUM('ACTIVE','RELEASED','CONVERTED') NOT NULL DEFAULT 'ACTIVE',
    expires_at         DATETIME        NOT NULL COMMENT 'Hết hạn giữ xe',
    active_vehicle_id  BIGINT UNSIGNED GENERATED ALWAYS AS
                           (IF(status = 'ACTIVE', vehicle_id, NULL)) STORED,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                       ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_reservation_active_vehicle (active_vehicle_id),
    KEY idx_reservations_order (order_id),
    KEY idx_reservations_expiry (status, expires_at),
    CONSTRAINT fk_reservations_order FOREIGN KEY (order_id)
        REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Giữ xe trong thời gian chờ đặt cọc';
