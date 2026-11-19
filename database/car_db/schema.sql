-- ============================================================================
-- CAR_DB - SCHEMA (car-service)
-- MySQL 8.0+ | utf8mb4 | InnoDB
-- Danh mục xe: hãng, phân loại, dòng xe, phiên bản, ảnh dòng xe.
-- Chạy file này trước, sau đó chạy seed.sql (nếu cần dữ liệu mẫu).
-- ============================================================================

CREATE DATABASE IF NOT EXISTS car_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE car_db;

CREATE TABLE IF NOT EXISTS brands (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(120)    NOT NULL,
    logo_url    VARCHAR(500)    DEFAULT NULL,
    description TEXT            DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_brands_name (name)
) ENGINE=InnoDB COMMENT='Hãng xe: Toyota, Honda, VinFast...';

CREATE TABLE IF NOT EXISTS categories (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)    NOT NULL,
    description VARCHAR(255)    DEFAULT NULL,
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_categories_name (name)
) ENGINE=InnoDB COMMENT='Phân loại: Sedan, SUV, Crossover...';

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

CREATE TABLE IF NOT EXISTS car_images (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    model_id           BIGINT UNSIGNED NOT NULL,
    image_url          VARCHAR(500)    NOT NULL,
    is_thumbnail       BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order         INT UNSIGNED    NOT NULL DEFAULT 0,
    -- Mỗi dòng xe chỉ có tối đa 1 ảnh đại diện
    thumbnail_model_id BIGINT UNSIGNED GENERATED ALWAYS AS
                           (IF(is_thumbnail = TRUE, model_id, NULL)) VIRTUAL,
    created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_car_thumbnail (thumbnail_model_id),
    KEY idx_car_images_model (model_id, sort_order),
    CONSTRAINT fk_car_images_model FOREIGN KEY (model_id)
        REFERENCES car_models (id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ảnh của dòng xe';
