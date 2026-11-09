-- ============================================================================
-- PAYMENT_DB - SEED DATA
-- Yêu cầu: đã chạy schema.sql của database này trước.
-- Có thể chạy lại nhiều lần (INSERT IGNORE).
-- ============================================================================

USE payment_db;

-- Dữ liệu mẫu (khớp ví dụ đơn hàng trong thiết kế) ---------------------
-- Đơn hàng mẫu nằm ở order_db. Ở đây chỉ tạo bản ghi thanh toán tương ứng.
-- Bỏ comment nếu muốn thử dữ liệu mẫu:
-- INSERT INTO payments (id, order_id, payment_type, amount, status) VALUES
--     (1, 1, 'DEPOSIT',   100000000, 'PAID'),
--     (2, 1, 'REMAINING', 1100000000, 'PENDING');
-- INSERT INTO payment_transactions
--     (id, payment_id, transaction_code, gateway, response_code,
--      transaction_status, amount, paid_at) VALUES
--     (1, 1, 'VNP-20261109-0001', 'VNPAY', '00', 'SUCCESS', 100000000, NOW());
