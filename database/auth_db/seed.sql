-- ============================================================================
-- AUTH_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE auth_db;

-- Dữ liệu mẫu -----------------------------------------------------------
INSERT IGNORE INTO roles (id, name, description) VALUES
    (1, 'CUSTOMER', 'Khách hàng mua xe'),
    (2, 'ADMIN',    'Quản trị viên hệ thống'),
    (3, 'STAFF',    'Nhân viên showroom / kinh doanh');

-- Mật khẩu mẫu cho cả 2 tài khoản: Admin@123
INSERT IGNORE INTO users (id, email, password_hash, phone, status) VALUES
    (1, 'admin@carsales.vn',    '$2b$12$iUHyDgJZVA08Kc5nKT8egu0kaKE7QXL8B1PRQUfTm8BLyBMc9DHIu', '0901000001', 'ACTIVE'),
    (2, 'customer@carsales.vn', '$2b$12$iUHyDgJZVA08Kc5nKT8egu0kaKE7QXL8B1PRQUfTm8BLyBMc9DHIu', '0901000002', 'ACTIVE');

INSERT IGNORE INTO user_roles (user_id, role_id) VALUES
    (1, 2),  -- admin  -> ADMIN
    (2, 1);  -- customer -> CUSTOMER
