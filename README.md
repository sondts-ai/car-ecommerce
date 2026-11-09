# Car E-commerce

Hệ thống thương mại điện tử bán ô tô, thiết kế theo kiến trúc microservices.

## Cấu trúc repository

```
.
├── README.md
└── database/
    ├── README.md
    ├── auth_db/
    │   ├── schema.sql
    │   └── seed.sql
    ├── customer_db/
    │   ├── schema.sql
    │   └── seed.sql
    ├── vehicle_db/
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
| Vehicle Service | `vehicle_db` | Danh mục xe, từng chiếc xe, tồn kho |
| Order Service | `order_db` | Giỏ hàng, đơn hàng, đặt cọc, giữ xe |
| Payment Service | `payment_db` | Thanh toán, giao dịch, hoàn tiền |

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
