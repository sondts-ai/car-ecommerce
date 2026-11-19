# inventory-service

Service quản lý **từng chiếc xe cụ thể**: thông tin xe, ảnh, giấy tờ, chi nhánh, lịch sử trạng thái, thống kê.
Cổng mặc định **8085**. Dùng database `vehicle_db` có sẵn (xem `database/vehicle_db`), **không thay đổi cấu trúc DB**;
service này chỉ đọc/ghi các bảng `vehicles`, `vehicle_images`, `vehicle_documents`, `branches`, `inventory`, `inventory_history`.
Chi nhánh của một xe nằm ở bảng `inventory` (1 xe = 1 dòng). Tên xe đầy đủ ("Hãng Dòng Phiên bản") lấy từ `car-service` qua REST.

## Endpoint

`/api/v1/admin/**` yêu cầu JWT role `ADMIN`; `/api/v1/internal/**` nhận mọi token hợp lệ.
Phản hồi: `{ "success": bool, "message": "...", "data": ... }`; danh sách phân trang trả
`data = { items, page, size, totalItems, totalPages }`.

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/v1/admin/vehicles?status=&branchId=&versionId=&condition=&minPrice=&maxPrice=&q=&page=&size=` | `q` tìm theo VIN/biển số; có tên xe đầy đủ (cache theo versionId trong request) |
| POST | `/api/v1/admin/vehicles` | kiểm tra phiên bản qua car-service (404 → 400); VIN 17 ký tự, trùng → 409; NEW thì km = 0; trạng thái đầu AVAILABLE + history "Nhập xe" |
| GET | `/api/v1/admin/vehicles/{id}` | kèm ảnh, giấy tờ, chi nhánh |
| PUT | `/api/v1/admin/vehicles/{id}` | không sửa status/chi nhánh; xe SOLD không sửa giá (409) |
| DELETE | `/api/v1/admin/vehicles/{id}` | 409 nếu RESERVED/SOLD |
| PATCH | `/api/v1/admin/vehicles/{id}/status` | `{status, reason}`; ghi `inventory_history`; không cho đổi từ SOLD (409) |
| GET | `/api/v1/admin/vehicles/{id}/history` | mới nhất trước |
| POST | `/api/v1/admin/vehicles/{id}/images` | `{imageUrl, isThumbnail, sortOrder}` |
| PATCH / DELETE | `/api/v1/admin/vehicle-images/{id}/thumbnail`, `/api/v1/admin/vehicle-images/{id}` | |
| POST / DELETE | `/api/v1/admin/vehicles/{id}/documents`, `/api/v1/admin/vehicle-documents/{id}` | |
| PATCH | `/api/v1/admin/vehicles/{id}/branch` | `{branchId, reason}` |
| GET / POST | `/api/v1/admin/branches` | |
| GET / PUT / DELETE | `/api/v1/admin/branches/{id}` | DELETE → 409 nếu còn xe |
| GET | `/api/v1/admin/stats/vehicles` | theo status, chi nhánh, condition |
| GET | `/api/v1/internal/vehicles/{id}` | `{id, vin, name, versionId, condition, year, color, mileage, price, status, branchName, thumbnailUrl}` |

Gọi car-service: `RestClient`, timeout 3 giây, chuyển tiếp token của request; lỗi kết nối → **503**, car-service trả lỗi → **502**.
Khi car-service báo 404 cho một phiên bản, `name` của xe đó là `null`.

Swagger UI: `http://localhost:8085/swagger-ui.html`.

## Biến môi trường

| Biến | Mặc định (local) |
|---|---|
| `SERVER_PORT` | `8085` |
| `DB_URL` | `jdbc:mysql://localhost:3306/vehicle_db?...` |
| `DB_USERNAME` / `DB_PASSWORD` | `car_app` / `CarApp@123` |
| `JWT_SECRET` | giá trị dev cố định, **phải trùng Auth Service** và ≥ 32 byte |
| `JWT_ISSUER` | `car-sales-auth` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` |
| `CAR_SERVICE_URL` | `http://localhost:8084` |

## Chạy

```bash
mysql -ucar_app -p < ../database/vehicle_db/schema.sql
mysql -ucar_app -p < ../database/vehicle_db/seed.sql
mvn spring-boot:run      # cần car-service đang chạy ở CAR_SERVICE_URL cho các API hiển thị tên xe
```

## Test

```bash
mvn test
```

Test dùng H2 (chế độ MySQL), `CarServiceClient` được mock, JWT tự sinh để thử 401/403.

## Chưa làm / cần hỏi

- **Giữ xe (hold), giải phóng hold, job tự hết hạn giữ xe** chưa làm được: `vehicle_db` không có bảng giữ xe.
  Cơ chế giữ xe hiện nằm ở `order_db.vehicle_reservations` (thuộc Order Service) nên service này không truy cập được.
  Nếu cần, phải thống nhất: hoặc thêm bảng vào `vehicle_db`, hoặc Order Service gọi API đổi trạng thái xe.
- **Ghi người đổi trạng thái (`changed_by`)** chưa làm được: bảng `inventory_history` không có cột này.
- **Chuyển chi nhánh**: yêu cầu chỉ nêu body `{branchId, reason}` mà không nói lưu lý do ở đâu. Hiện cập nhật `inventory.branch_id`
  và ghi một dòng `inventory_history` (trạng thái cũ = mới) với lý do "Chuyển chi nhánh từ A sang B: ...". Cần xác nhận.
- **Đổi trạng thái thủ công sang RESERVED**: hiện được phép nhưng không có hold đi kèm. Cần quyết định có chặn không.
- **Xóa xe** xóa luôn ảnh, giấy tờ, lịch sử và dòng `inventory` của xe đó.
- Ràng buộc "1 thumbnail / xe" do cột sinh + UNIQUE của MySQL đảm bảo; H2 trong test không có.
- Chưa chạy thử với MySQL thật (Hibernate `validate`); test mới chạy trên H2.
- `JWT_SECRET` mặc định chỉ để chạy local.
