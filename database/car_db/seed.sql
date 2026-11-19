-- ============================================================================
-- CAR_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE car_db;

INSERT IGNORE INTO brands (id, name, logo_url, description) VALUES
    (1, 'Toyota',    'https://logo.clearbit.com/toyota.com',    'Hãng xe Nhật Bản'),
    (2, 'Honda',     'https://logo.clearbit.com/honda.com',     'Hãng xe Nhật Bản'),
    (3, 'VinFast',   'https://logo.clearbit.com/vinfast.vn',    'Hãng xe Việt Nam'),
    (4, 'Mercedes-Benz', 'https://logo.clearbit.com/mercedes-benz.com', 'Hãng xe Đức');

INSERT IGNORE INTO categories (id, name, description) VALUES
    (1, 'Sedan',     'Xe sedan 4 cửa'),
    (2, 'SUV',       'Xe thể thao đa dụng'),
    (3, 'Crossover', 'Xe lai SUV/hatchback'),
    (4, 'Luxury',    'Xe hạng sang');

INSERT IGNORE INTO car_models (id, brand_id, name, description) VALUES
    (1, 1, 'Camry',  'Sedan hạng D'),
    (2, 2, 'CR-V',   'SUV 5+2 chỗ'),
    (3, 3, 'VF 8',   'SUV điện 5 chỗ'),
    (4, 4, 'C 200',  'Sedan hạng sang');

INSERT IGNORE INTO car_versions
    (id, model_id, version_name, engine, transmission, fuel_type, seats) VALUES
    (1, 1, '2.0Q',       '2.0L',      'AUTO', 'GASOLINE', 5),
    (2, 1, '2.5HEV MID', '2.5L Hybrid','AUTO', 'HYBRID',  5),
    (3, 1, '2.5HEV TOP', '2.5L Hybrid','AUTO', 'HYBRID',  5),
    (4, 2, 'L AWD',      '1.5L Turbo','CVT',  'GASOLINE', 7),
    (5, 3, 'Plus',       'Electric',  'AUTO', 'ELECTRIC', 5),
    (6, 4, 'C 200 Avantgarde', '1.5L Turbo', 'AUTO', 'GASOLINE', 5);

INSERT IGNORE INTO car_model_categories (model_id, category_id) VALUES
    (1, 1), (2, 2), (2, 3), (3, 2), (4, 1), (4, 4);

-- Ảnh dòng xe: bảng mới (vehicle_db cũ chưa có), dùng lại URL ảnh của các xe mẫu,
-- mỗi dòng xe 1 ảnh đại diện (Camry, CR-V, VF 8).
INSERT IGNORE INTO car_images
    (id, model_id, image_url, is_thumbnail, sort_order) VALUES
    (1, 1, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200', TRUE, 1),
    (2, 2, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200', TRUE, 1),
    (3, 3, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200', TRUE, 1);
