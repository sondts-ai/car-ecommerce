-- ============================================================================
-- CUSTOMER_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE customer_db;

-- Dữ liệu mẫu -----------------------------------------------------------
INSERT IGNORE INTO customers (id, user_id, full_name, birthday, gender) VALUES
    (1, 2, 'Nguyễn Văn Khách', '1995-08-20', 'MALE');

INSERT IGNORE INTO customer_addresses
    (id, customer_id, receiver_name, phone, address, is_default) VALUES
    (1, 1, 'Nguyễn Văn Khách', '0901000002',
     '123 Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh', TRUE);
