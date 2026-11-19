-- ============================================================================
-- VEHICLE_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE vehicle_db;

-- Dữ liệu mẫu -----------------------------------------------------------
INSERT IGNORE INTO brands (id, name, logo_url, description) VALUES
    (1, 'Toyota',    'https://logo.clearbit.com/toyota.com',    'Hãng xe Nhật Bản'),
    (2, 'Honda',     'https://logo.clearbit.com/honda.com',     'Hãng xe Nhật Bản'),
    (3, 'VinFast',   'https://logo.clearbit.com/vinfast.vn',    'Hãng xe Việt Nam'),
    (4, 'Mercedes-Benz', 'https://logo.clearbit.com/mercedes-benz.com', 'Hãng xe Đức');

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

INSERT IGNORE INTO categories (id, name, description) VALUES
    (1, 'Sedan',     'Xe sedan 4 cửa'),
    (2, 'SUV',       'Xe thể thao đa dụng'),
    (3, 'Crossover', 'Xe lai SUV/hatchback'),
    (4, 'Luxury',    'Xe hạng sang');

INSERT IGNORE INTO car_model_categories (model_id, category_id) VALUES
    (1, 1), (2, 2), (2, 3), (3, 2), (4, 1), (4, 4);

INSERT IGNORE INTO branches (id, name, address, phone) VALUES
    (1, 'Showroom Hà Nội',  'Số 1 Phạm Hùng, Nam Từ Liêm, Hà Nội',        '0241000001'),
    (2, 'Showroom TP.HCM',  'Số 2 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh', '0281000002'),
    (3, 'Showroom Đà Nẵng', 'Số 3 Nguyễn Tất Thành, Thanh Khê, Đà Nẵng', '0236100003');

-- 3 chiếc Camry 2.0Q cùng phiên bản nhưng khác tình trạng / km / giá
INSERT IGNORE INTO vehicles
    (id, version_id, vin, license_plate, `condition`, year, color, mileage, price, description, status) VALUES
    (1, 1, 'JTNB11HK0M3000001', '30A-123.45', 'NEW',  2026, 'Trắng ngọc trai',      0, 1200000000, 'Xe mới nguyên chiếc, giao ngay', 'AVAILABLE'),
    (2, 1, 'JTNB11HK0N3000002', '30A-234.56', 'USED', 2022, 'Đen',              35000,  850000000, 'Xe lướt, bảo dưỡng chính hãng',   'AVAILABLE'),
    (3, 1, 'JTNB11HK0M3000003', '30A-345.67', 'USED', 2021, 'Bạc',              50000,  820000000, 'Xe gia đình sử dụng, còn đẹp',    'AVAILABLE'),
    (4, 4, 'JHLRW2H50SX000004', '30A-456.78', 'NEW',  2026, 'Đỏ',                   0, 1150000000, 'Honda CR-V L AWD mới',            'AVAILABLE'),
    (5, 5, 'RLLV1AEB0NH000005', '30A-567.89', 'NEW',  2026, 'Xanh',                 0,  999000000, 'VinFast VF 8 Plus mới',           'AVAILABLE');

INSERT IGNORE INTO vehicle_images
    (id, vehicle_id, image_url, is_thumbnail, sort_order) VALUES
    (1, 1, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200', TRUE,  1),
    (2, 1, 'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200', FALSE, 2),
    (3, 2, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200', TRUE,  1),
    (4, 3, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200', TRUE,  1),
    (5, 4, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200', TRUE,  1),
    (6, 5, 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200', TRUE,  1);

INSERT IGNORE INTO vehicle_documents
    (id, vehicle_id, document_type, file_url) VALUES
    (1, 1, 'REGISTRATION', '/docs/vehicles/1/registration.pdf'),
    (2, 1, 'INSPECTION',   '/docs/vehicles/1/inspection.pdf'),
    (3, 2, 'REGISTRATION', '/docs/vehicles/2/registration.pdf');

INSERT IGNORE INTO inventory (id, vehicle_id, branch_id, quantity) VALUES
    (1, 1, 1, 1),
    (2, 2, 1, 1),
    (3, 3, 2, 1),
    (4, 4, 2, 1),
    (5, 5, 3, 1);

INSERT IGNORE INTO inventory_history
    (id, vehicle_id, old_status, new_status, reason) VALUES
    (1, 1, NULL, 'AVAILABLE', 'Nhập xe mới về showroom'),
    (2, 2, NULL, 'AVAILABLE', 'Nhập xe lướt về showroom'),
    (3, 3, NULL, 'AVAILABLE', 'Nhập xe lướt về showroom');
