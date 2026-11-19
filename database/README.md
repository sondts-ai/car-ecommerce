# Cơ sở dữ liệu hệ thống bán ô tô (MySQL 8+)

Thiết kế database theo kiến trúc **microservices**, mỗi service sở hữu một database riêng.

## 1. Cấu trúc thư mục

```
database/
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

Mỗi database gồm:

- `schema.sql`: tạo database, bảng, khóa ngoại, index, check constraint.
- `seed.sql`: dữ liệu mẫu (chạy sau `schema.sql`).

## 2. Thứ tự chạy

Chạy lần lượt theo thứ tự nghiệp vụ:

```bash
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/auth_db/schema.sql
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/auth_db/seed.sql

mysql -h127.0.0.1 -P3306 -ucar_app -p < database/customer_db/schema.sql
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/customer_db/seed.sql

mysql -h127.0.0.1 -P3306 -ucar_app -p < database/car_db/schema.sql
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/car_db/seed.sql

mysql -h127.0.0.1 -P3306 -ucar_app -p < database/inventory_db/schema.sql
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/inventory_db/seed.sql

mysql -h127.0.0.1 -P3306 -ucar_app -p < database/order_db/schema.sql
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/order_db/seed.sql

mysql -h127.0.0.1 -P3306 -ucar_app -p < database/payment_db/schema.sql
mysql -h127.0.0.1 -P3306 -ucar_app -p < database/payment_db/seed.sql
```

Trong DBeaver: mở từng file `schema.sql` → **Execute script** (Alt+X), sau đó mở `seed.sql` → **Execute script**.
Các file dùng `CREATE ... IF NOT EXISTS` và `INSERT IGNORE` nên có thể chạy lại nhiều lần.

## 3. Thông tin kết nối

| Thông số | Giá trị |
|---|---|
| Host | `localhost` (hoặc `127.0.0.1`) |
| Port | `3306` |
| User ứng dụng | `car_app` |
| Password | `CarApp@123` |
| Database | `auth_db`, `customer_db`, `car_db`, `inventory_db`, `order_db`, `payment_db` |

Tạo user ứng dụng (chạy bằng tài khoản admin MySQL):

```sql
CREATE USER IF NOT EXISTS 'car_app'@'%' IDENTIFIED BY 'CarApp@123';
GRANT ALL PRIVILEGES ON auth_db.*     TO 'car_app'@'%';
GRANT ALL PRIVILEGES ON customer_db.* TO 'car_app'@'%';
GRANT ALL PRIVILEGES ON car_db.*       TO 'car_app'@'%';
GRANT ALL PRIVILEGES ON inventory_db.* TO 'car_app'@'%';
GRANT ALL PRIVILEGES ON order_db.*    TO 'car_app'@'%';
GRANT ALL PRIVILEGES ON payment_db.*  TO 'car_app'@'%';
FLUSH PRIVILEGES;
```

## 4. Thiết kế chi tiết

### A. `auth_db` – Auth Service (3 bảng)

| Bảng | Cột chính |
|---|---|
| `users` | `id`, `email` (UNIQUE), `password_hash`, `phone`, `status`, `created_at`, `updated_at` |
| `roles` | `id`, `name` (`CUSTOMER` / `ADMIN` / `STAFF`), `description` |
| `user_roles` | `user_id` + `role_id` (PK kép), FK CASCADE |

- Quan hệ N–N giữa `users` và `roles` qua `user_roles`.
- Mật khẩu seed: `Admin@123` (BCrypt).

### B. `customer_db` – Customer Service (2 bảng)

| Bảng | Cột chính |
|---|---|
| `customers` | `id`, `user_id` (UNIQUE, tham chiếu logic `auth_db.users.id`), `full_name`, `birthday`, `gender`, timestamps |
| `customer_addresses` | `id`, `customer_id` (FK), `receiver_name`, `phone`, `address`, `is_default` |

- Ràng buộc mỗi khách chỉ có **1 địa chỉ mặc định** bằng generated column + UNIQUE.
- `customers.user_id` là tham chiếu logic xuyên service (không tạo FK vật lý).

### C. `car_db` – Car Service (6 bảng)

Danh mục xe (tách ra từ `vehicle_db` cũ).

| Bảng | Cột chính |
|---|---|
| `brands` | `id`, `name` (UNIQUE), `logo_url`, `description` |
| `categories` | `id`, `name` (UNIQUE), `description` |
| `car_models` | `id`, `brand_id` (FK RESTRICT), `name`, `description`; UNIQUE (`brand_id`, `name`) |
| `car_versions` | `id`, `model_id` (FK), `version_name`, `engine`, `transmission`, `fuel_type`, `seats` (2–60); UNIQUE (`model_id`, `version_name`) |
| `car_model_categories` | `model_id` + `category_id` (PK kép, N–N) |
| `car_images` | `id`, `model_id` (FK CASCADE), `image_url`, `is_thumbnail`, `sort_order` |

- Mỗi dòng xe tối đa 1 ảnh thumbnail (generated column + UNIQUE).
- Không xóa được hãng còn dòng xe (`ON DELETE RESTRICT`).

### D. `inventory_db` – Inventory Service (6 bảng)

Từng chiếc xe cụ thể, chi nhánh, giữ xe, lịch sử trạng thái.

| Bảng | Cột chính |
|---|---|
| `branches` | `id`, `name` (UNIQUE), `address`, `phone` |
| `vehicles` | `id`, `version_id` (logic → `car_db.car_versions.id`), `branch_id` (FK), `vin` (UNIQUE), `license_plate` (UNIQUE), `condition`, `year`, `color`, `mileage`, `price`, `description`, `status` |
| `vehicle_images` | `id`, `vehicle_id` (FK CASCADE), `image_url`, `is_thumbnail`, `sort_order` |
| `vehicle_documents` | `id`, `vehicle_id` (FK CASCADE), `document_type`, `file_url` |
| `vehicle_holds` | `id`, `vehicle_id` (FK), `order_id` (logic), `customer_id` (logic), `status` (`ACTIVE` / `RELEASED` / `CONVERTED`), `expires_at`, `released_reason` |
| `vehicle_status_history` | `id`, `vehicle_id` (FK CASCADE), `old_status`, `new_status`, `reason`, `changed_by` (logic → user id, nullable) |

- `condition`: `NEW` / `USED`; `status`: `AVAILABLE` / `RESERVED` / `SOLD` / `MAINTENANCE`.
- Ràng buộc: xe `NEW` phải có `mileage = 0`; mỗi xe tối đa 1 ảnh thumbnail.
- Mỗi dòng `vehicles` là **một chiếc xe cụ thể**, không phải một dòng xe. Chi nhánh
  lưu trực tiếp ở `vehicles.branch_id` (thay bảng `inventory` cũ).
- `vehicle_holds`: UNIQUE trên cột sinh `active_vehicle_id` bảo đảm mỗi xe chỉ có
  tối đa 1 lượt giữ `ACTIVE`; index (`status`, `expires_at`) phục vụ job hết hạn.
- `version_id` không có FK vì `car_versions` nằm ở database khác; service kiểm tra
  bằng REST tới car-service.

### E. `order_db` – Order Service (6 bảng)

| Bảng | Cột chính |
|---|---|
| `carts` | `id`, `customer_id` (logic), `status`, timestamps |
| `cart_items` | `id`, `cart_id` (FK), `vehicle_id` (logic), `added_at` |
| `orders` | `id`, `order_code` (UNIQUE), `customer_id`, `subtotal`, `total_amount`, `deposit_amount`, `remaining_amount`, `status`, `reserved_until` |
| `order_items` | `id`, `order_id` (FK), `vehicle_id`, `vehicle_name`, `vin`, `price` (snapshot) |
| `order_status_history` | `id`, `order_id` (FK), `old_status`, `new_status`, `note`, `changed_by` |
| `vehicle_reservations` | `id`, `vehicle_id`, `order_id` (FK), `customer_id`, `status`, `expires_at` |

- Trạng thái đơn: `PENDING_DEPOSIT → DEPOSIT_PAID → CONFIRMED →
  WAITING_REMAINING_PAYMENT → COMPLETED`, cùng các trạng thái kết thúc
  `CANCELLED`, `EXPIRED`, `REFUNDED`.
- `order_items` lưu snapshot tên xe / VIN / giá tại thời điểm đặt.
- Mỗi khách chỉ có 1 giỏ `ACTIVE` (generated column + UNIQUE).
- `vehicle_reservations` là cơ chế giữ xe: UNIQUE trên cột sinh
  `active_vehicle_id` bảo đảm mỗi chiếc xe chỉ có tối đa 1 reservation `ACTIVE`,
  ngăn 2 đơn hàng cùng giữ/mua thành công một chiếc xe.

### F. `payment_db` – Payment Service (3 bảng)

| Bảng | Cột chính |
|---|---|
| `payments` | `id`, `order_id` (logic), `payment_type` (`DEPOSIT` / `REMAINING`), `amount`, `status` |
| `payment_transactions` | `id`, `payment_id` (FK), `transaction_code` (UNIQUE), `gateway`, `response_code`, `transaction_status`, `paid_at` |
| `refunds` | `id`, `payment_id` (FK), `amount`, `reason`, `status` |

- Một đơn hàng có nhiều `payments` (cọc, phần còn lại, trả nhiều lần).
- Một `payment` có nhiều `payment_transactions` để hỗ trợ **retry** giao dịch.
- `payment_transactions.transaction_code` là UNIQUE để chống trùng giao dịch.

## 5. Dữ liệu mẫu

| Nhóm | Dữ liệu |
|---|---|
| Tài khoản | `admin@carsales.vn`, `customer@carsales.vn` – mật khẩu `Admin@123` |
| Vai trò | `CUSTOMER`, `ADMIN`, `STAFF` |
| Khách hàng | Nguyễn Văn Khách + 1 địa chỉ mặc định |
| Hãng / dòng xe | Toyota Camry, Honda CR-V, VinFast VF 8, Mercedes C 200 |
| Xe | 5 xe, gồm 3 xe Camry 2.0Q (NEW 0 km / USED 35.000 km / USED 50.000 km) đúng ví dụ |
| Chi nhánh | Hà Nội, TP.HCM, Đà Nẵng |

## 6. Quy ước thiết kế

- **Không dùng khóa ngoại vật lý xuyên database** (`user_id`, `customer_id`,
  `vehicle_id`, `order_id` chỉ là tham chiếu logic), đúng nguyên tắc mỗi service
  sở hữu database riêng.
- Trong từng database vẫn dùng đầy đủ FK, UNIQUE, CHECK, index.
- Mọi bảng dùng `InnoDB`, `utf8mb4`, `utf8mb4_0900_ai_ci`.
