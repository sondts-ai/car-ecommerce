-- ============================================================================
-- INVENTORY_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- version_id khớp với car_db.car_versions trong car_db/seed.sql.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE inventory_db;

INSERT IGNORE INTO branches (id, name, address, phone) VALUES
    (1, 'Showroom Hà Nội',  'Số 1 Phạm Hùng, Nam Từ Liêm, Hà Nội',        '0241000001'),
    (2, 'Showroom TP.HCM',  'Số 2 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh', '0281000002'),
    (3, 'Showroom Đà Nẵng', 'Số 3 Nguyễn Tất Thành, Thanh Khê, Đà Nẵng', '0236100003');

-- 3 chiếc Camry 2.0Q cùng phiên bản nhưng khác tình trạng / km / giá
-- branch_id lấy từ bảng inventory cũ của vehicle_db.
INSERT IGNORE INTO vehicles
    (id, version_id, branch_id, vin, license_plate, `condition`, year, color, mileage, price, description, status) VALUES
    (1, 1, 1, 'JTNB11HK0M3000001', '30A-123.45', 'NEW',  2026, 'Trắng ngọc trai',      0, 1200000000, 'Xe mới nguyên chiếc, giao ngay', 'AVAILABLE'),
    (2, 1, 1, 'JTNB11HK0N3000002', '30A-234.56', 'USED', 2022, 'Đen',              35000,  850000000, 'Xe lướt, bảo dưỡng chính hãng',   'AVAILABLE'),
    (3, 1, 2, 'JTNB11HK0M3000003', '30A-345.67', 'USED', 2021, 'Bạc',              50000,  820000000, 'Xe gia đình sử dụng, còn đẹp',    'AVAILABLE'),
    (4, 4, 2, 'JHLRW2H50SX000004', '30A-456.78', 'NEW',  2026, 'Đỏ',                   0, 1150000000, 'Honda CR-V L AWD mới',            'AVAILABLE'),
    (5, 5, 3, 'RLLV1AEB0NH000005', '30A-567.89', 'NEW',  2026, 'Xanh',                 0,  999000000, 'VinFast VF 8 Plus mới',           'AVAILABLE');

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

-- Chuyển từ inventory_history cũ (changed_by chưa có ở bản cũ nên để NULL)
INSERT IGNORE INTO vehicle_status_history
    (id, vehicle_id, old_status, new_status, reason, changed_by) VALUES
    (1, 1, NULL, 'AVAILABLE', 'Nhập xe mới về showroom', NULL),
    (2, 2, NULL, 'AVAILABLE', 'Nhập xe lướt về showroom', NULL),
    (3, 3, NULL, 'AVAILABLE', 'Nhập xe lướt về showroom', NULL);

-- Lượt giữ mẫu đã RELEASED (không còn ACTIVE nên xe 1 vẫn AVAILABLE).
-- order_id / customer_id là ID logic mẫu, order_db hiện chưa có đơn nào.
INSERT IGNORE INTO vehicle_holds
    (id, vehicle_id, order_id, customer_id, status, expires_at, released_reason) VALUES
    (1, 1, 1, 1, 'RELEASED', '2026-01-01 00:00:00', 'Hết hạn giữ xe');
