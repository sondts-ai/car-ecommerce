# Car E-commerce

Hệ thống thương mại điện tử bán ô tô, thiết kế theo kiến trúc microservices.

## Cấu trúc repository

```
.
├── README.md
├── car-service/         # Spring Boot, cổng 8084, car_db
├── inventory-service/   # Spring Boot, cổng 8085, inventory_db
├── postman/             # Postman collection cho API admin
└── database/
    ├── README.md
    ├── auth_db/
    │   ├── schema.sql
    │   └── seed.sql
    ├── customer_db/
    │   ├── schema.sql
    │   └── seed.sql
    ├── car_db/
    │   ├── schema.sql
    │   └── seed.sql
    ├── inventory_db/
    │   ├── schema.sql
    │   └── seed.sql
    ├── order_db/
    │   ├── schema.sql
    │   └── seed.sql
    └── payment_db/
        ├── schema.sql
        └── seed.sql
```

## Các service và database

| Service | Database | Chức năng |
|---|---|---|
| Auth Service | `auth_db` | Tài khoản, vai trò, phân quyền |
| Customer Service | `customer_db` | Hồ sơ khách hàng, sổ địa chỉ |
| Car Service (cổng 8084) | `car_db` | Danh mục xe: hãng, phân loại, dòng xe, phiên bản, ảnh dòng xe |
| Inventory Service (cổng 8085) | `inventory_db` | Từng chiếc xe, chi nhánh, giữ xe, lịch sử trạng thái |
| Order Service | `order_db` | Giỏ hàng, đơn hàng, đặt cọc, giữ xe |
| Payment Service | `payment_db` | Thanh toán, giao dịch, hoàn tiền |

## Chạy backend admin

Yêu cầu Java 17+, Maven, MySQL 8 (đã chạy `schema.sql` + `seed.sql` của `car_db`, `inventory_db`). Chi tiết và biến
môi trường xem [`car-service/README.md`](./car-service/README.md) và [`inventory-service/README.md`](./inventory-service/README.md).

```bash
cd car-service && mvn spring-boot:run          # http://localhost:8084/swagger-ui.html
cd inventory-service && mvn spring-boot:run    # http://localhost:8085/swagger-ui.html
```

Collection Postman: `postman/Admin-Car-Service.postman_collection.json`, `postman/Admin-Inventory-Service.postman_collection.json`
(điền `adminToken`, `customerToken`).

## Bắt đầu

Xem hướng dẫn chi tiết tại [`database/README.md`](./database/README.md):

- Thứ tự chạy `schema.sql` / `seed.sql`
- Thông tin kết nối MySQL
- Mô tả chi tiết từng bảng và ràng buộc
- Dữ liệu mẫu

## Công nghệ

- MySQL 8.0+
- InnoDB, utf8mb4
- Kiến trúc microservices: mỗi service sở hữu database riêng, tham chiếu xuyên
  service bằng ID logic (không dùng khóa ngoại vật lý xuyên database)
