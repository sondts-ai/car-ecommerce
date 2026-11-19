-- ============================================================================
-- INVENTORY_DB - SCHEMA (inventory-service)
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Từng chiếc xe cụ thể, chi nhánh, giữ xe, lịch sử trạng thái.
-- version_id tham chiếu LOGIC tới car_db.car_versions.id (không có FK).
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS inventory_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE inventory_db;

CREATE TABLE IF NOT EXISTS branches (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150)    NOT NULL,
    address    VARCHAR(500)    NOT NULL,
    phone      VARCHAR(20)     DEFAULT NULL,
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_branches_name (name)
) ENGINE=InnoDB COMMENT='Showroom / chi nhánh';

CREATE TABLE IF NOT EXISTS vehicles (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    version_id     BIGINT UNSIGNED NOT NULL COMMENT 'Tham chiếu logic car_db.car_versions.id',
    branch_id      BIGINT UNSIGNED NOT NULL,
    vin            VARCHAR(17)     NOT NULL COMMENT 'Số khung - UNIQUE',
    license_plate  VARCHAR(20)     DEFAULT NULL COMMENT 'Biển số (nếu có)',
    `condition`    ENUM('NEW','USED') NOT NULL DEFAULT 'NEW',
    year           SMALLINT UNSIGNED NOT NULL,
    color          VARCHAR(50)     DEFAULT NULL,
    mileage        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT 'Số km đã đi',
    price          DECIMAL(15,2)   NOT NULL COMMENT 'Giá bán của từng chiếc (VND)',
    description    TEXT            DEFAULT NULL,
    status         ENUM('AVAILABLE','RESERVED','SOLD','MAINTENANCE')
                                   NOT NULL DEFAULT 'AVAILABLE',
    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                   ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_vehicles_vin (vin),
    UNIQUE KEY uk_vehicles_plate (license_plate),
    KEY idx_vehicles_version (version_id),
    KEY idx_vehicles_branch (branch_id),
    KEY idx_vehicles_status (status),
    KEY idx_vehicles_price (price),
    KEY idx_vehicles_condition (`condition`),
    CONSTRAINT fk_vehicles_branch FOREIGN KEY (branch_id)
        REFERENCES branches (id) ON DELETE RESTRICT,
    CONSTRAINT chk_vehicles_year CHECK (year BETWEEN 1900 AND 2100),
    CONSTRAINT chk_vehicles_new_mileage CHECK (`condition` <> 'NEW' OR mileage = 0),
    CONSTRAINT chk_vehicles_price CHECK (price >= 0)
) ENGINE=InnoDB COMMENT='Từng chiếc xe cụ thể được bán (không phải dòng xe)';

CREATE TABLE IF NOT EXISTS vehicle_images (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id            BIGINT UNSIGNED NOT NULL,
    image_url             VARCHAR(500)    NOT NULL,
    is_thumbnail          BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order            INT UNSIGNED    NOT NULL DEFAULT 0,
    -- Mỗi xe chỉ có tối đa 1 ảnh đại diện
    thumbnail_vehicle_id  BIGINT UNSIGNED GENERATED ALWAYS AS
                              (IF(is_thumbnail = TRUE, vehicle_id, NULL)) VIRTUAL,
    created_at            DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_vehicle_thumbnail (thumbnail_vehicle_id),
    KEY idx_vehicle_images_vehicle (vehicle_id, sort_order),
    CONSTRAINT fk_vehicle_images_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ảnh của từng chiếc xe';

CREATE TABLE IF NOT EXISTS vehicle_documents (
    id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id    BIGINT UNSIGNED NOT NULL,
    document_type ENUM('REGISTRATION','INSPECTION','INSURANCE','INVOICE','OTHER')
                                  NOT NULL,
    file_url      VARCHAR(500)    NOT NULL,
    created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_vehicle_documents_vehicle (vehicle_id),
    CONSTRAINT fk_vehicle_documents_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Giấy tờ xe: đăng ký, đăng kiểm, bảo hiểm...';

CREATE TABLE IF NOT EXISTS vehicle_holds (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id      BIGINT UNSIGNED NOT NULL,
    order_id        BIGINT UNSIGNED NOT NULL COMMENT 'Tham chiếu logic order_db.orders.id',
    customer_id     BIGINT UNSIGNED NOT NULL COMMENT 'Tham chiếu logic customer_db.customers.id',
    status          ENUM('ACTIVE','RELEASED','CONVERTED') NOT NULL DEFAULT 'ACTIVE',
    expires_at      DATETIME        NOT NULL,
    released_reason VARCHAR(500)    DEFAULT NULL,
    -- Mỗi xe chỉ có tối đa 1 lượt giữ ACTIVE
    active_vehicle_id BIGINT UNSIGNED GENERATED ALWAYS AS
                          (IF(status = 'ACTIVE', vehicle_id, NULL)) STORED,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_holds_active_vehicle (active_vehicle_id),
    KEY idx_holds_vehicle (vehicle_id),
    KEY idx_holds_status_expires (status, expires_at),
    CONSTRAINT fk_holds_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Lượt giữ xe cho đơn đặt cọc';

CREATE TABLE IF NOT EXISTS vehicle_status_history (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    old_status ENUM('AVAILABLE','RESERVED','SOLD','MAINTENANCE') DEFAULT NULL,
    new_status ENUM('AVAILABLE','RESERVED','SOLD','MAINTENANCE') NOT NULL,
    reason     VARCHAR(500)    DEFAULT NULL,
    changed_by BIGINT UNSIGNED DEFAULT NULL COMMENT 'Tham chiếu logic auth_db.users.id',
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_status_history_vehicle (vehicle_id, created_at),
    CONSTRAINT fk_status_history_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch sử thay đổi trạng thái của từng chiếc xe';
