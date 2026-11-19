-- ============================================================================
-- VEHICLE_DB - SCHEMA
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS vehicle_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE vehicle_db;

-- ---------------------------------------------------------------------------
-- Nhóm 1: DANH MỤC XE
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brands (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(120)    NOT NULL,
    logo_url    VARCHAR(500)    DEFAULT NULL,
    description TEXT            DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_brands_name (name)
) ENGINE=InnoDB COMMENT='Hãng xe: Toyota, Honda, VinFast...';

CREATE TABLE IF NOT EXISTS car_models (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    brand_id    BIGINT UNSIGNED NOT NULL,
    name        VARCHAR(150)    NOT NULL,
    description TEXT            DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_models_brand_name (brand_id, name),
    CONSTRAINT fk_models_brand FOREIGN KEY (brand_id)
        REFERENCES brands (id) ON DELETE RESTRICT
) ENGINE=InnoDB COMMENT='Dòng xe: Camry, CR-V, VF 8...';

CREATE TABLE IF NOT EXISTS car_versions (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    model_id     BIGINT UNSIGNED NOT NULL,
    version_name VARCHAR(150)    NOT NULL,
    engine       VARCHAR(100)    DEFAULT NULL COMMENT 'Ví dụ: 2.0L, 2.5L Hybrid',
    transmission ENUM('AUTO','MANUAL','CVT','DCT') DEFAULT NULL,
    fuel_type    ENUM('GASOLINE','DIESEL','HYBRID','ELECTRIC') DEFAULT NULL,
    seats        TINYINT UNSIGNED DEFAULT NULL,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_versions_model_name (model_id, version_name),
    CONSTRAINT fk_versions_model FOREIGN KEY (model_id)
        REFERENCES car_models (id) ON DELETE CASCADE,
    CONSTRAINT chk_versions_seats CHECK (seats IS NULL OR seats BETWEEN 2 AND 60)
) ENGINE=InnoDB COMMENT='Phiên bản của dòng xe: 2.0Q, 2.5HEV MID...';

CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    description VARCHAR(255)    DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_name (name)
) ENGINE=InnoDB COMMENT='Phân loại: Sedan, SUV, Crossover...';

-- Bảng trung gian N-N giữa dòng xe và phân loại
CREATE TABLE IF NOT EXISTS car_model_categories (
    model_id    BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (model_id, category_id),
    KEY idx_model_categories_category (category_id),
    CONSTRAINT fk_model_categories_model FOREIGN KEY (model_id)
        REFERENCES car_models (id) ON DELETE CASCADE,
    CONSTRAINT fk_model_categories_category FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Gán phân loại cho dòng xe (N-N)';

-- ---------------------------------------------------------------------------
-- Nhóm 2: TỪNG CHIẾC XE ĐƯỢC BÁN
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    version_id     BIGINT UNSIGNED NOT NULL,
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
    KEY idx_vehicles_status (status),
    KEY idx_vehicles_price (price),
    KEY idx_vehicles_condition (`condition`),
    CONSTRAINT fk_vehicles_version FOREIGN KEY (version_id)
        REFERENCES car_versions (id) ON DELETE RESTRICT,
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

-- ---------------------------------------------------------------------------
-- Nhóm 3: QUẢN LÝ TỒN KHO
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branches (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150)    NOT NULL,
    address    VARCHAR(500)    NOT NULL,
    phone      VARCHAR(20)     DEFAULT NULL,
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_branches_name (name)
) ENGINE=InnoDB COMMENT='Showroom / chi nhánh';

CREATE TABLE IF NOT EXISTS inventory (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    branch_id  BIGINT UNSIGNED NOT NULL,
    quantity   TINYINT UNSIGNED NOT NULL DEFAULT 1,
    updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_inventory_vehicle (vehicle_id),
    KEY idx_inventory_branch (branch_id),
    CONSTRAINT fk_inventory_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE CASCADE,
    CONSTRAINT fk_inventory_branch FOREIGN KEY (branch_id)
        REFERENCES branches (id) ON DELETE RESTRICT,
    -- Mỗi dòng inventory ứng với 1 chiếc xe cụ thể nên quantity luôn = 1
    CONSTRAINT chk_inventory_quantity CHECK (quantity = 1)
) ENGINE=InnoDB COMMENT='Xe đang nằm ở chi nhánh nào (1 dòng = 1 chiếc xe)';

CREATE TABLE IF NOT EXISTS inventory_history (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    vehicle_id BIGINT UNSIGNED NOT NULL,
    old_status ENUM('AVAILABLE','RESERVED','SOLD','MAINTENANCE') DEFAULT NULL,
    new_status ENUM('AVAILABLE','RESERVED','SOLD','MAINTENANCE') NOT NULL,
    reason     VARCHAR(500)    DEFAULT NULL,
    created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_inventory_history_vehicle (vehicle_id, created_at),
    CONSTRAINT fk_inventory_history_vehicle FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch sử thay đổi trạng thái của từng chiếc xe';
