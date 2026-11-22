# Payment Service

Payment Service chỉ xử lý **đặt cọc xe** và sử dụng `payment_db`.

## Chạy service

Yêu cầu Java 17+, Maven và MySQL 8. Chạy trước:

```bash
mysql -u root -p < ../database/payment_db/schema.sql
mvn spring-boot:run
```

Service mặc định chạy tại `http://localhost:8086`.

Biến môi trường:

```text
PAYMENT_SERVER_PORT=8086
PAYMENT_DB_URL=jdbc:mysql://localhost:3306/payment_db
PAYMENT_DB_USERNAME=root
PAYMENT_DB_PASSWORD=
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

## API đặt cọc

`orderId` là ID logic của đơn hàng trong `order_db`. Service không nhận
`paymentType` từ client và luôn tạo loại `DEPOSIT`.

### Tạo payment intent

```http
POST /api/v1/payments/intent
Content-Type: application/json

{
  "orderId": 1,
  "amount": 100000000,
  "gateway": "VNPAY"
}
```

### Xác nhận đặt cọc

```http
POST /api/v1/payments/{paymentId}/confirm
Content-Type: application/json

{
  "responseCode": "00"
}
```

Hiện tại bước xác nhận mô phỏng gateway thành công. Khi tích hợp VNPay/MoMo
thật, bước này phải được thay bằng callback/webhook đã xác thực chữ ký.

### Yêu cầu hoàn tiền

```http
POST /api/v1/payments/{paymentId}/refunds
Content-Type: application/json

{
  "amount": 100000000,
  "reason": "Khách hàng hủy đặt cọc"
}
```

Yêu cầu hoàn tiền được tạo ở trạng thái `PENDING`; service chưa tự động chuyển
tiền hoặc kết nối cổng thanh toán thật.
