# AutoWeb — Tài liệu API & lớp kết nối

Tài liệu mô tả **mock backend** chạy ngay trong Next.js (`app/api/**`) và **service layer** ở `lib/api/**`.
Khi có backend thật, chỉ cần đổi biến môi trường — toàn bộ UI không phải sửa.

---

## 1. Kiến trúc tổng quan

```
UI components (client)
        │  gọi hàm typed
        ▼
lib/api/services/*.service.ts   ← connector: authApi, carsApi, depositsApi, paymentsApi, testDrivesApi, profileApi
        │
        ▼
lib/api/http.ts                  ← fetch wrapper: base URL, Bearer token, timeout, bóc envelope, chuẩn hoá lỗi
        │  HTTP JSON
        ▼
app/api/**/route.ts              ← mock backend (Next.js Route Handlers, dữ liệu in-memory)
```

| File | Vai trò |
| --- | --- |
| `lib/api/config.ts` | `API_CONFIG` (baseUrl, timeout, token storage key) + `ENDPOINTS` |
| `lib/api/token.ts` | đọc/ghi/xoá access token trong `localStorage`, `hasSession()` |
| `lib/api/http.ts` | `request()`, `http.get/post/patch/...`, `ApiError`, `getErrorMessage`, `getErrorDetails`, `buildQuery` |
| `lib/api/types.ts` | toàn bộ DTO & payload TypeScript |
| `lib/api/services/` | hàm gọi API theo domain, đã bọc sẵn kiểu dữ liệu |
| `lib/api/index.ts` | barrel export — UI chỉ cần `import { ... } from "@/lib/api"` |

---

## 2. Biến môi trường

Tạo `.env.local` từ `.env.example`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_API_TIMEOUT=15000
NEXT_PUBLIC_USE_MOCK_API=true
```

| Biến | Ý nghĩa |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Base URL API. `/api` = mock backend cùng domain. Backend thật: `https://api.autoweb.vn/v1` |
| `NEXT_PUBLIC_API_TIMEOUT` | Timeout mỗi request (ms) |
| `NEXT_PUBLIC_USE_MOCK_API` | `true` (mặc định) dùng mock; `false` = chỉ gọi backend thật |

> Biến có tiền tố `NEXT_PUBLIC_` được nhúng vào bundle phía client. Không đặt secret ở đây.

---

## 3. Chuẩn response

### Thành công

```json
{
  "success": true,
  "data": { "...": "..." },
  "message": "Tuỳ chọn",
  "meta": { "page": 1, "pageSize": 12, "total": 24, "totalPages": 2 }
}
```

### Lỗi

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ.",
    "details": { "phone": "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0." }
  }
}
```

`details` dùng để map lỗi vào từng field của form — `getErrorDetails(error)` trả về object này.

### Mã lỗi thường gặp

| `code` | HTTP | Ý nghĩa |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 / 422 | Dữ liệu không hợp lệ, xem `details` |
| `INVALID_CREDENTIALS` | 401 / 400 | Sai tài khoản/mật khẩu (hoặc sai mật khẩu hiện tại) |
| `UNAUTHORIZED` | 401 | Chưa có / sai Bearer token |
| `FORBIDDEN` | 403 | Không có quyền |
| `NOT_FOUND` | 404 | Không tìm thấy tài nguyên |
| `CONFLICT` | 409 | Trùng lịch, trùng email/số điện thoại |
| `OUT_OF_STOCK` | 409 | Xe vừa hết hàng khi tạo đơn cọc |
| `OTP_INVALID` | 400 | OTP sai hoặc hết hạn |
| `NETWORK_ERROR` | 0 | Không kết nối được / timeout |

### Xác thực

Các endpoint cần đăng nhập nhận header:

```
Authorization: Bearer <accessToken>
```

`accessToken` được lưu tự động vào `localStorage` (`autoweb.access_token`) sau khi `authApi.login()` thành công và được gắn vào mọi request (trừ `login`, `register`, `forgot-password`, `verify-otp`, `reset-password`).

---

## 4. Danh sách endpoint

Base: `/api`

### 4.1 Health

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/health` | Kiểm tra mock backend còn sống | — |

### 4.2 Auth

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| POST | `/auth/login` | Đăng nhập bằng email **hoặc** số điện thoại | — |
| POST | `/auth/register` | Đăng ký tài khoản | — |
| POST | `/auth/logout` | Huỷ session phía server | ✓ |
| POST | `/auth/forgot-password` | Gửi OTP (mock trả `devOtp`) | — |
| POST | `/auth/verify-otp` | Xác thực OTP, trả `resetToken` | — |
| POST | `/auth/reset-password` | Đặt lại mật khẩu bằng OTP | — |
| POST | `/auth/change-password` | Đổi mật khẩu (cần mật khẩu hiện tại) | ✓ |

**Login**

```json
// POST /api/auth/login
{ "identifier": "demo@autoweb.vn", "password": "Autoweb@123" }
```

```json
// 200
{
  "success": true,
  "data": {
    "accessToken": "…",
    "refreshToken": "….refresh",
    "expiresIn": 86400,
    "user": { "id": "usr_demo", "fullName": "Nguyễn Văn An", "email": "demo@autoweb.vn", "phone": "0901234567", "tier": "Kim Cương", "joinedAt": "…" }
  },
  "message": "Chào mừng trở lại, Nguyễn Văn An!"
}
```

**Register** — `{ fullName, email, phone, password }` (password ≥ 8 ký tự). Lỗi trùng: `EMAIL_TAKEN`, `CONFLICT`.

**Forgot password** — `{ email }` → `{ email, expiresInMinutes: 10, devOtp: "123456", accountExists }`.
`devOtp` **chỉ có ở mock** để test; backend thật không được trả OTP.

**Verify OTP** — `{ email, otp }` → `{ verified: true, resetToken }`.

**Reset password** — `{ email, otp, newPassword }`.

**Change password** — `{ currentPassword, newPassword }`.

### 4.3 Customers

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/customers/me` | Hồ sơ khách hàng hiện tại | ✓ |
| PATCH | `/customers/me` | Cập nhật hồ sơ | ✓ |

PATCH body: `{ fullName?, phone?, birthday?, address?, city?, newsletter? }` → trả hồ sơ đã cập nhật.

### 4.4 Cars

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/cars` | Danh sách + tìm kiếm + lọc + phân trang | — |
| GET | `/cars/{slug}` | Chi tiết mẫu xe | — |
| GET | `/cars/{slug}/availability` | Kiểm tra tồn kho (UC: Check availability) | — |
| GET | `/cars/{slug}/reviews` | Danh sách đánh giá | — |
| POST | `/cars/{slug}/reviews` | Gửi đánh giá | — (khách: `verified: false`; đã đăng nhập: `true`) |

**Query `GET /cars`**

| Param | Kiểu | Ví dụ |
| --- | --- | --- |
| `q` | string | `vinfast` |
| `brands` | CSV | `BMW,VinFast` |
| `bodyTypes` | CSV | `SUV,Sedan` |
| `fuels` | CSV | `electric,hybrid` |
| `priceRange` | string | `1-2` (khoảng tỷ, theo `lib/cars.ts`) |
| `sort` | `featured` \| `price-asc` \| `price-desc` \| `rating` | `price-asc` |
| `page` / `pageSize` | number | `1` / `12` (pageSize tối đa 50) |

**Availability**

```json
{
  "success": true,
  "data": {
    "carSlug": "bmw-x5-xdrive40i",
    "status": "available",
    "unitsLeft": 3,
    "checkedAt": "2026-11-17T09:00:00.000Z",
    "holdMinutes": 15,
    "note": "Xe đang trong kho và sẵn sàng giao trong 7–14 ngày."
  }
}
```

**Create review** — `{ rating: 1..5, title?, content }` (content ≥ 20 ký tự).

### 4.5 Deposits

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/deposits` | Đơn cọc của khách đang đăng nhập | ✓ |
| POST | `/deposits` | Tạo đơn đặt cọc (guest được phép) | — |
| GET | `/deposits/{id}` | Chi tiết đơn (id hoặc mã `DC-...`) | ✓ |

```json
// POST /api/deposits
{
  "carSlug": "bmw-x5-xdrive40i",
  "showroomId": "hn-tay-ho",
  "amount": 50000000,
  "note": "Muốn nhận xe màu đen",
  "customer": { "fullName": "Nguyễn Văn An", "phone": "0901234567", "email": "an@email.com" }
}
```

`amount`: tối thiểu 10.000.000 ₫, tối đa 30% giá xe. Nếu xe hết hàng → `409 OUT_OF_STOCK`.

Trả về `DepositDto` gồm `id`, `code` (`DC-YYYYMMDD-XXXX`), `status: "pending_payment"`, `holdUntil` (+15 phút).

### 4.6 Payments

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/payments/intent` | Tạo giao dịch cho đơn cọc |
| POST | `/payments/{id}/confirm` | Xác nhận thanh toán (mock: luôn thành công) |

```json
// POST /api/payments/intent
{ "depositId": "dep_xxx", "method": "vnpay" }   // vnpay | visa | transfer | showroom
```

Intent trả `QRCode`/`redirectUrl` cho VNPAY. Confirm chuyển payment → `succeeded`, deposit → `paid`, gia hạn `holdUntil` 15 ngày.

### 4.7 Test drives

| Method | Path | Mô tả | Auth |
| --- | --- | --- | --- |
| GET | `/test-drives` | Lịch lái thử của khách | ✓ |
| POST | `/test-drives` | Đặt lịch (guest được phép) | — |
| GET | `/test-drives/slots?carSlug=&showroomId=&date=` | Khung giờ trống theo ngày | — |

```json
// POST /api/test-drives
{
  "carSlug": "vinfast-vf-9-plus",
  "showroomId": "hcm-q7",
  "date": "2026-11-20",
  "time": "14:30",
  "hasLicense": true,
  "note": "Muốn chạy thử cao tốc",
  "customer": { "fullName": "Nguyễn Văn An", "phone": "0901234567" }
}
```

Ràng buộc: ngày trong 30 ngày tới, `time` thuộc `TEST_DRIVE_SLOTS`, khung giờ chưa bị đặt (`409 CONFLICT`).
Trả về `TestDriveDto` với `code` dạng `TD-YYYYMMDD-XXXX`.

---

## 5. Cách dùng trong component

```tsx
"use client";

import { useState } from "react";
import { getErrorDetails, getErrorMessage, depositsApi, carsApi } from "@/lib/api";

const [availability, setAvailability] = useState<AvailabilityDto | null>(null);

// Kiểm tra tồn kho
setAvailability(await carsApi.checkAvailability(car.slug));

// Tạo đơn cọc + map lỗi vào form
try {
  const deposit = await depositsApi.create({
    carSlug: car.slug,
    showroomId: "hn-tay-ho",
    amount: 50_000_000,
    customer: { fullName, phone, email },
  });
  console.log("Mã đơn:", deposit.code);
} catch (error) {
  setErrors(getErrorDetails(error));        // { phone: "…", amount: "…" }
  setBanner(getErrorMessage(error));        // câu thông báo chung
}
```

Danh sách hàm có sẵn:

| Service | Hàm |
| --- | --- |
| `authApi` | `login`, `register`, `logout`, `forgotPassword`, `verifyOtp`, `resetPassword`, `changePassword` |
| `profileApi` | `getMe`, `updateMe` |
| `carsApi` | `list`, `getBySlug`, `checkAvailability`, `listReviews`, `createReview` |
| `depositsApi` | `create`, `get`, `list` |
| `paymentsApi` | `createIntent`, `confirm` |
| `testDrivesApi` | `create`, `list`, `slots` |

---

## 6. Chuyển sang backend thật

1. Backend implement đúng envelope `{ success, data, message?, meta? }` và các path trong `ENDPOINTS` (`lib/api/config.ts`).
2. Đổi `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://api.autoweb.vn/v1
NEXT_PUBLIC_USE_MOCK_API=false
```

3. Nếu backend dùng path khác, chỉ sửa `ENDPOINTS` — không cần chạm vào component.
4. Nếu backend xác thực bằng cookie httpOnly thay vì Bearer token, sửa `lib/api/http.ts` (bỏ header `Authorization`, thêm `credentials: "include"`) và `lib/api/token.ts`.
5. Xoá (hoặc giữ để test offline) thư mục `app/api/**` khi production — không ảnh hưởng UI.

---

## 7. Ghi chú về mock backend

- Dữ liệu lưu **in-memory** trong `app/api/_lib/store.ts` (`globalThis.__autowebMockStore`), reset khi restart dev server.
- Độ trễ giả lập 150–1100 ms để thấy loading/skeleton.
- Tài khoản demo: `demo@autoweb.vn` / `Autoweb@123`.
- OTP quên mật khẩu hiển thị ngay trên UI (trường `devOtp`).
- Token là UUID lưu trong `Map` phía server; không có refresh token thật.

---

## 8. Kiểm thử nhanh bằng curl

```bash
# 1. Health
curl http://localhost:3000/api/health

# 2. Đăng nhập
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"demo@autoweb.vn\",\"password\":\"Autoweb@123\"}"

# 3. Tồn kho
curl http://localhost:3000/api/cars/bmw-x5-xdrive40i/availability

# 4. Tạo đơn cọc
curl -X POST http://localhost:3000/api/deposits \
  -H "Content-Type: application/json" \
  -d "{\"carSlug\":\"bmw-x5-xdrive40i\",\"showroomId\":\"hn-tay-ho\",\"amount\":50000000,\"customer\":{\"fullName\":\"Nguyễn Văn An\",\"phone\":\"0901234567\",\"email\":\"an@email.com\"}}"

# 5. Tạo payment intent (thay <depositId>)
curl -X POST http://localhost:3000/api/payments/intent \
  -H "Content-Type: application/json" \
  -d "{\"depositId\":\"<depositId>\",\"method\":\"vnpay\"}"

# 6. Xác nhận thanh toán (thay <paymentId>)
curl -X POST http://localhost:3000/api/payments/<paymentId>/confirm

# 7. Khung giờ lái thử
curl "http://localhost:3000/api/test-drives/slots?carSlug=vinfast-vf-9-plus&showroomId=hcm-q7&date=2026-11-20"

# 8. Hồ sơ (thay <token> lấy từ bước 2)
curl http://localhost:3000/api/customers/me -H "Authorization: Bearer <token>"
```
