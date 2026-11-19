# car-service

Service quản lý **danh mục xe** (hãng, phân loại, dòng xe, phiên bản, ảnh dòng xe) cho trang quản trị.
Cổng mặc định **8084**, database `car_db` (xem `database/car_db`).

## Endpoint

Mọi API `/api/v1/admin/**` yêu cầu JWT role `ADMIN`; `/api/v1/internal/**` nhận mọi token hợp lệ.
Phản hồi: `{ "success": bool, "message": "...", "data": ... }`. Danh sách phân trang trả
`data = { items, page, size, totalItems, totalPages }` (size mặc định 20, tối đa 100).

| Method | Path | Ghi chú |
|---|---|---|
| GET | `/api/v1/admin/brands?q=&page=&size=` | tìm theo tên |
| POST | `/api/v1/admin/brands` | trùng tên → 409 |
| GET / PUT / DELETE | `/api/v1/admin/brands/{id}` | DELETE → 409 nếu còn dòng xe |
| GET / POST | `/api/v1/admin/categories` | hỗ trợ `q`, `page`, `size` |
| GET / PUT / DELETE | `/api/v1/admin/categories/{id}` | xóa sẽ gỡ phân loại khỏi các dòng xe |
| GET | `/api/v1/admin/car-models?brandId=&categoryId=&q=&page=&size=` | kèm tên hãng, phân loại, thumbnail |
| POST | `/api/v1/admin/car-models` | `{brandId, name, description, categoryIds[]}` |
| GET / PUT / DELETE | `/api/v1/admin/car-models/{id}` | GET kèm versions + images; DELETE → 409 nếu còn phiên bản |
| GET / POST | `/api/v1/admin/car-models/{id}/versions` | |
| PUT / DELETE | `/api/v1/admin/versions/{id}` | |
| POST | `/api/v1/admin/car-models/{id}/images` | `{imageUrl, isThumbnail, sortOrder}` |
| PATCH | `/api/v1/admin/car-images/{id}/thumbnail` | bỏ thumbnail cũ trong cùng transaction |
| DELETE | `/api/v1/admin/car-images/{id}` | |
| GET | `/api/v1/internal/versions/{id}` | `{versionId, versionName, modelId, modelName, brandId, brandName, fuelType, transmission, seats}` |

Swagger UI: `http://localhost:8084/swagger-ui.html`.

## Biến môi trường

| Biến | Mặc định (local) |
|---|---|
| `SERVER_PORT` | `8084` |
| `DB_URL` | `jdbc:mysql://localhost:3306/car_db?...` |
| `DB_USERNAME` / `DB_PASSWORD` | `car_app` / `CarApp@123` |
| `JWT_SECRET` | giá trị dev cố định, **phải trùng Auth Service** và ≥ 32 byte |
| `JWT_ISSUER` | `car-sales-auth` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` |

## Chạy

```bash
# 1. Tạo database (xem database/README.md)
mysql -ucar_app -p < ../database/car_db/schema.sql
mysql -ucar_app -p < ../database/car_db/seed.sql
# 2. Chạy service
mvn spring-boot:run
```

## Test

```bash
mvn test
```

Test dùng H2 (chế độ MySQL), tự sinh JWT HS256 để thử các case 401/403.

## Chưa làm / cần hỏi

- Xóa phiên bản (`DELETE /versions/{id}`) hiện **không** kiểm tra xem inventory-service còn xe dùng phiên bản đó
  hay không (yêu cầu chưa nêu, và không được truy cập DB service khác). Cần thống nhất: gọi API nội bộ của
  inventory để chặn 409, hay chấp nhận.
- Chỉ role `ADMIN` được vào API admin; `STAFF` chưa có quyền (đặc tả chỉ nói ADMIN).
- Ràng buộc "1 thumbnail / dòng xe" ở MySQL do cột sinh + UNIQUE đảm bảo; test H2 chỉ kiểm tra logic của service.
- Chưa chạy thử với MySQL thật (Hibernate `validate`): đã chạy test bằng H2, chưa kiểm chứng trên MySQL.
- `JWT_SECRET` mặc định chỉ để chạy local, không dùng ở môi trường thật.
