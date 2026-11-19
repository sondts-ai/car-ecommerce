# inventory-service

Service quản lý **từng chiếc xe cụ thể**: thông tin xe, ảnh, giấy tờ, chi nhánh, lượt giữ xe, lịch sử trạng thái, thống kê.
Cổng mặc định **8085**, database `inventory_db` (xem `database/inventory_db`).
Tên xe đầy đủ ("Hãng Dòng Phiên bản") lấy từ `car-service` qua REST; `version_id` chỉ là ID logic, không có FK.

## Endpoint

`/api/v1/admin/**` yêu cầu JWT role `ADMIN`; `/api/v1/internal/**` nhận mọi token hợp lệ.
Phản hồi: `{ "success": bool, "message": "...", "data": ... }`; danh sách phân trang trả
`data = { items, page, size, totalItems, totalPages }`.

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/v1/admin/vehicles?status=&branchId=&versionId=&condition=&minPrice=&maxPrice=&q=&page=&size=` | `q` tìm theo VIN/biển số; có tên xe đầy đủ (cache theo versionId trong request) |
| POST | `/api/v1/admin/vehicles` | kiểm tra phiên bản qua car-service (404 → 400); VIN 17 ký tự, trùng → 409; NEW thì km = 0; trạng thái đầu AVAILABLE + history "Nhập xe" |
| GET | `/api/v1/admin/vehicles/{id}` | kèm ảnh, giấy tờ, chi nhánh, lượt giữ ACTIVE |
| PUT | `/api/v1/admin/vehicles/{id}` | không sửa status/chi nhánh; xe SOLD không sửa giá (409) |
| DELETE | `/api/v1/admin/vehicles/{id}` | 409 nếu RESERVED/SOLD hoặc có hold ACTIVE |
| PATCH | `/api/v1/admin/vehicles/{id}/status` | `{status, reason}`; ghi history với `changed_by` = `userId` trong JWT; 409 nếu có hold ACTIVE hoặc xe SOLD |
| GET | `/api/v1/admin/vehicles/{id}/history` | mới nhất trước |
| POST | `/api/v1/admin/vehicles/{id}/images` | `{imageUrl, isThumbnail, sortOrder}` |
| PATCH / DELETE | `/api/v1/admin/vehicle-images/{id}/thumbnail`, `/api/v1/admin/vehicle-images/{id}` | |
| POST / DELETE | `/api/v1/admin/vehicles/{id}/documents`, `/api/v1/admin/vehicle-documents/{id}` | |
| PATCH | `/api/v1/admin/vehicles/{id}/branch` | `{branchId, reason}` |
| GET / POST | `/api/v1/admin/branches` | |
| GET / PUT / DELETE | `/api/v1/admin/branches/{id}` | DELETE → 409 nếu còn xe |
| GET | `/api/v1/admin/holds?status=&vehicleId=&page=&size=` | |
| POST | `/api/v1/admin/holds/{id}/release` | `{reason}`; chỉ hold ACTIVE; hold → RELEASED, xe RESERVED → AVAILABLE, ghi history, 1 transaction |
| GET | `/api/v1/admin/stats/vehicles` | theo status, chi nhánh, condition |
| GET | `/api/v1/internal/vehicles/{id}` | `{id, vin, name, versionId, condition, year, color, mileage, price, status, branchName, thumbnailUrl}` |

Job `@Scheduled` mỗi 60 giây: hold ACTIVE quá `expires_at` → RELEASED (reason "Hết hạn giữ xe"), xe RESERVED → AVAILABLE,
ghi history (`changed_by` NULL). Tắt bằng `HOLD_EXPIRY_JOB_ENABLED=false`.

Gọi car-service: `RestClient`, timeout 3 giây, chuyển tiếp token của request; lỗi kết nối → **503**, car-service trả lỗi → **502**.
Khi car-service báo 404 cho một phiên bản (đã bị xóa), `name` của xe đó là `null`.

Swagger UI: `http://localhost:8085/swagger-ui.html`.

## Biến môi trường

| Biến | Mặc định (local) |
|---|---|
| `SERVER_PORT` | `8085` |
| `DB_URL` | `jdbc:mysql://localhost:3306/inventory_db?...` |
| `DB_USERNAME` / `DB_PASSWORD` | `car_app` / `CarApp@123` |
| `JWT_SECRET` | giá trị dev cố định, **phải trùng Auth Service** và ≥ 32 byte |
| `JWT_ISSUER` | `car-sales-auth` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` |
| `CAR_SERVICE_URL` | `http://localhost:8084` |
| `HOLD_EXPIRY_JOB_ENABLED` | `true` |

## Chạy

```bash
mysql -ucar_app -p < ../database/inventory_db/schema.sql
mysql -ucar_app -p < ../database/inventory_db/seed.sql
mvn spring-boot:run      # cần car-service đang chạy ở CAR_SERVICE_URL cho các API hiển thị tên xe
```

## Test

```bash
mvn test
```

Test dùng H2 (chế độ MySQL), `CarServiceClient` được mock, JWT tự sinh để thử 401/403.

## Chưa làm / cần hỏi

- **Chuyển chi nhánh**: yêu cầu chỉ nêu body `{branchId, reason}` mà không nói lưu lý do ở đâu. Hiện ghi một dòng
  `vehicle_status_history` (trạng thái cũ = mới) với lý do "Chuyển chi nhánh từ A sang B: ...". Cần xác nhận.
- **Đổi trạng thái thủ công sang RESERVED**: hiện được phép (đặc tả không cấm) nhưng sẽ tạo xe RESERVED không có hold.
  Cần quyết định có chặn không.
- **Xóa xe đã từng có hold** (kể cả RELEASED): trả 409 vì `vehicle_holds` giữ FK RESTRICT tới xe (để không mất lịch sử giữ xe).
  Xe mẫu số 1 vì vậy không xóa được.
- **Xóa xe** xóa luôn ảnh, giấy tờ, lịch sử trạng thái của xe đó.
- Hold chỉ được tạo bởi Order Service (chưa có API tạo hold trong phạm vi này); `order_id`/`customer_id` là ID logic.
- Ràng buộc "mỗi xe tối đa 1 hold ACTIVE" và "1 thumbnail / xe" do cột sinh + UNIQUE của MySQL đảm bảo; H2 trong test không có.
- Chưa chạy thử với MySQL thật (Hibernate `validate`); test mới chạy trên H2.
- `JWT_SECRET` mặc định chỉ để chạy local.
