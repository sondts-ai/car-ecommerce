-- ============================================================================
-- ORDER_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE order_db;

-- Dữ liệu mẫu -----------------------------------------------------------
INSERT IGNORE INTO carts (id, customer_id, status) VALUES
    (1, 1, 'ACTIVE');

INSERT IGNORE INTO cart_items (id, cart_id, vehicle_id) VALUES
    (1, 1, 1);
