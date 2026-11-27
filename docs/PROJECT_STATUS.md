# Trạng thái dự án — Car E-commerce

Cập nhật: 2026-11-27. Tài liệu này mô tả **cái gì chạy thật, cái gì còn mock**, và
những việc còn lại. Dùng để báo cáo / bàn giao.

---

## 1. Tóm tắt

| Hạng mục | Trạng thái |
|---|---|
| 6 backend service Spring Boot | ✅ chạy thật, test pass |
| Auth + JWT dùng chung | ✅ |
| Customer profile + địa chỉ | ✅ |
| Order (tạo đơn đặt cọc, đọc đơn/lịch sử) | ✅ |
| Payment (intent/confirm/refund mô phỏng) → Order `DEPOSIT_PAID` | ✅ |
| Payment yêu cầu JWT, xác thực profile và quyền sở hữu order | ✅ |
| Car admin API (hãng/dòng/phiên bản) | ✅ |
| Inventory admin API (xe/chi nhánh/ảnh/giấy tờ/trạng thái) | ✅ |
| Nginx gateway cho API khách + admin + inventory | ✅ |
| Docker image + compose + healthcheck | ✅ |
| Jenkins CI (build/test/push) | ✅ |
| Deploy EC2 | ⏳ chờ môi trường (code + script đã sẵn) |
| UI admin (dashboard, catalog, inventory, deposits, test drives) | ✅ Next.js `/admin` |
| Catalog xe công khai | ⚠️ **mock** |
| Lái thử | ✅ Customer Service + `customer_db` persistence |
| Đánh giá / quên mật khẩu | ⚠️ **mock** |

---

## 2. Luồng nào chạy thật, luồng nào mock

| Luồng người dùng | Nguồn dữ liệu |
|---|---|
| Đăng ký / đăng nhập / đổi mật khẩu | ✅ Auth Service |
| Hồ sơ cá nhân | ✅ Customer Service (profile tự tạo khi đăng ký) |
| Danh sách / chi tiết xe | ⚠️ Mock `app/api/cars` |
| Kiểm tra tình trạng xe | ⚠️ Mock `app/api/cars/{slug}/availability` |
| Đánh giá xe | ⚠️ Mock `app/api/cars/{slug}/reviews` |
| Đặt cọc | ✅ Order Service + Payment Service |
| Thanh toán | ✅ Payment Service (mô phỏng gateway) |
| Lịch sử đơn hàng | ✅ Order Service |
| Đặt lái thử | ✅ Customer Service; guest bookings supported |
| Quên mật khẩu / OTP | ⚠️ Mock `app/api/auth/*` |
| Admin quản lý đơn cọc | ✅ Order Service list/status API + UI `/admin/orders` |
| Admin duyệt / từ chối lịch lái thử | ✅ Customer Service status API + UI `/admin/test-drives` |
| Admin CRUD xe | ✅ car-service + inventory-service + UI `/admin` |

> Catalog xe công khai, đánh giá và OTP vẫn dùng mock; luồng lái thử đã được
> chuyển sang Customer Service và lưu bền vững trong `customer_db`.

---

## 3. Đã sửa trong đợt rà soát gần nhất

| Vấn đề | Cách sửa | File |
|---|---|---|
| Token admin bị gán `role=CUSTOMER` → mọi API admin 403 | Chọn role theo ưu tiên `ADMIN > STAFF > CUSTOMER` | `auth-service/.../security/JwtService.java` + test |
| Đăng ký xong chưa có customer profile | Auth gọi `POST /customers/me` sau khi commit (best-effort) | `auth-service/.../client/CustomerProfileClient.java`, `AuthService.java` |
| Gateway không route admin/inventory | Thêm location cho `/admin/brands|categories|car-models|versions|vehicles|branches|stats|vehicle-images|vehicle-documents` | `docker/nginx/default.conf` |
| Gateway expose endpoint nội bộ | Chặn `/api/v1/internal/` và `/api/v1/me/internal/` | `docker/nginx/default.conf` |
| Thông báo đăng ký sai (nói đã gửi OTP) | Đổi thành “Tạo tài khoản thành công, vui lòng đăng nhập” | `components/auth/RegisterForm.tsx` |
| README order-service lỗi thời | Cập nhật API đã có + phần còn thiếu | `order-service/README.md` |
| Payment endpoint cho phép truy cập/chiếm payment của người khác | Bắt buộc JWT CUSTOMER, kiểm tra customer profile và ownership order | `payment-service/...`, `order-service/.../OrderController.java` |

---

## 4. Việc còn lại (theo thứ tự ưu tiên)

### P0 — nên làm nếu còn thời gian

1. **Catalog xe công khai thật**
   - Thêm API public (ví dụ `GET /api/v1/cars`, `GET /api/v1/cars/{id}`, `GET /api/v1/cars/{id}/availability`)
     đọc từ `vehicle_db` (inventory-service), trả DTO khớp `lib/cars.ts`.
   - Đổi `lib/api/services/cars.service.ts` sang gọi backend khi `useBackendServices=true`.
   - Đổi route Nginx `/api/v1/cars/` sang inventory khi API sẵn sàng.

2. **Giữ xe khi đặt cọc**
   - Order Service gọi inventory để kiểm tra trạng thái + giá/VIN.
   - Ghi `order_db.vehicle_reservations` (bảng đã có) và job hết hạn.
   - Hiện `POST /me/orders` đang tin dữ liệu client gửi lên.

3. **Đánh giá xe**
   - Cần bảng reviews (xem `customer-service/proposals/reviews_schema.sql`).
   - Hiện frontend dùng mock.

### P1 — có thể ghi “ngoài phạm vi”

4. Quên mật khẩu/OTP thật: cần bảng reset token dùng một lần + gửi email.
5. Payment gateway thật (VNPay/MoMo): cần callback + xác thực chữ ký; hiện confirm mô phỏng.
6. ~~Payment Service chưa xác thực JWT/ownership~~ — đã sửa: yêu cầu JWT CUSTOMER và kiểm tra customer profile + ownership order.
7. Test tích hợp toàn bộ 6 service với MySQL thật (hiện test dùng H2).
8. ~~UI admin~~ — đã hoàn thành (2026-11-27): dashboard, CRUD, đơn cọc và lịch lái thử tại `/admin`.

---

## 5. CI/CD

- Jenkins: `docker-compose.jenkins.yml` + `jenkins/Dockerfile` + `Jenkinsfile`.
- Hướng dẫn: `docs/CI_JENKINS.md`.
- Deploy EC2: `scripts/deploy.sh` + `docker-compose.prod.yml` + `.env.prod.example`.
- Trạng thái: **CI đã kiểm chứng** (image boot, Docker CLI + buildx, build image từ trong container).
  **CD chờ EC2** — không cần sửa code.

---

## 6. Kiểm tra nhanh trước khi báo cáo

```bash
# 1. Build toàn bộ image + chạy
docker compose up -d --build
docker compose ps                     # tất cả phải healthy

# 2. Gateway + frontend
curl -fsS http://localhost:8080/healthz
curl -fsS http://localhost:3000/api/health

# 3. Đăng nhập admin (sau khi rebuild auth-service)
TOKEN=$(curl -fsS -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@carsales.vn","password":"Admin@123"}' \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["data"]["token"])')

# 4. Gọi API admin qua gateway (phải 200, không phải 403)
curl -fsS http://localhost:8080/api/v1/admin/brands -H "Authorization: Bearer $TOKEN"

# 5. Test backend
for s in auth-service customer-service order-service car-service inventory-service payment-service; do
  (cd "$s" && mvn -q test) || echo "FAIL $s"
done
```

Tài khoản seed: `admin@carsales.vn` / `Admin@123`, `customer@carsales.vn` / `Admin@123`.

---

## 7. Kết quả kiểm chứng gần nhất (2026-11-27)

Đã build lại toàn bộ image và chạy `docker compose up -d --wait`, tất cả 9 container **healthy**.
Frontend build ra 40 route, bao gồm toàn bộ `/admin/*`.

| Kiểm tra | Kết quả |
|---|---|
| `GET :8080/healthz` | `ok` |
| Login `admin@carsales.vn` | token có claim `"role":"ADMIN"` |
| `GET :8080/api/v1/admin/brands` bằng token admin | 200 |
| `GET :8080/api/v1/admin/categories` | 200 |
| `GET :8080/api/v1/admin/vehicles` | 200 |
| `GET :8080/api/v1/me/internal/...` qua gateway | 404 (đã chặn) |
| Đăng ký tài khoản mới rồi `GET /api/v1/customers/me` | 201 → 200, profile tự tạo |
| `GET :3000/api/health` + `GET :3000/api/cars` | 200, trả dữ liệu mock |
| `GET :3000/admin/login` | 200 |
| Docker build frontend | 40 route, gồm `/admin`, `/admin/vehicles`, `/admin/car-models`... |
| `mvn test` auth-service | 6/6 pass |
| `npm run typecheck` (trong Docker build) | pass |
| `nginx -t`, `docker compose config` (+ prod overlay) | pass |

> Lưu ý cho người làm admin UI: các API danh sách dùng `page` **bắt đầu từ 0**
> (`page=0` là trang đầu) và tham số kích thước là `size`, không phải `pageSize`.
> Ví dụ: `/api/v1/admin/vehicles?page=0&size=20`.
