# Cấu trúc dự án — AutoWeb Customer (Next.js 15 + Tailwind CSS)

```
AutoWeb/
├─ app/                              # Next.js App Router
│  ├─ layout.tsx                     # Root layout: font, header, footer, metadata
│  ├─ globals.css                    # Tailwind + design tokens (ink/champagne/cream)
│  ├─ page.tsx                       # Trang chủ (hero, tìm kiếm nhanh, xe nổi bật…)
│  ├─ cars/
│  │  ├─ page.tsx                    # Danh sách xe + bộ lọc (đọc query ?q=&bodyType=…)
│  │  └─ [slug]/
│  │     ├─ page.tsx                 # Chi tiết xe + đánh giá + CTA đặt cọc/lái thử
│  │     ├─ deposit/page.tsx         # Luồng đặt cọc (kiểm tra xe → thanh toán)
│  │     └─ test-drive/page.tsx      # Luồng đặt lịch lái thử
│  ├─ login/page.tsx                 # Đăng nhập
│  ├─ register/page.tsx              # Đăng ký
│  ├─ forgot-password/page.tsx       # Khôi phục mật khẩu (OTP 2 bước)
│  └─ profile/page.tsx               # Hồ sơ: thông tin, đổi mật khẩu, đơn hàng
│
│  # Mock backend (Next.js Route Handlers, dữ liệu in-memory)
├─ app/api/
│  ├─ _lib/                          # store.ts, response.ts, validators.ts
│  ├─ health/route.ts
│  ├─ auth/{login,register,logout,forgot-password,verify-otp,reset-password,change-password}/route.ts
│  ├─ customers/me/route.ts          # GET / PATCH hồ sơ
│  ├─ cars/route.ts                  # Danh sách + lọc + phân trang
│  ├─ cars/[slug]/{route.ts,availability/route.ts,reviews/route.ts}
│  ├─ deposits/{route.ts,[id]/route.ts}
│  ├─ payments/{intent,[id]/confirm}/route.ts
│  └─ test-drives/{route.ts,slots/route.ts}
│
├─ components/
│  ├─ layout/
│  │  ├─ SiteHeader.tsx              # Header sticky, menu mobile
│  │  └─ SiteFooter.tsx              # Footer 4 cột + newsletter
│  ├─ cars/
│  │  ├─ CarListView.tsx             # ★ Danh sách xe + tìm kiếm + bộ lọc + sort
│  │  ├─ CarCard.tsx                 # Thẻ xe (ảnh, tên, giá, thông số)
│  │  ├─ CarVisual.tsx               # Ảnh placeholder SVG (không phụ thuộc mạng)
│  │  └─ ReviewSection.tsx           # Đánh giá sao + bình luận
│  ├─ booking/
│  │  ├─ DepositForm.tsx             # ★ Form đặt cọc 3 bước + kiểm tra tồn kho
│  │  └─ TestDriveForm.tsx           # ★ Form đặt lịch lái thử
│  ├─ auth/
│  │  ├─ AuthShell.tsx               # Layout 2 cột dùng chung cho auth
│  │  ├─ LoginForm.tsx
│  │  ├─ RegisterForm.tsx
│  │  └─ ForgotPasswordForm.tsx
│  ├─ profile/
│  │  └─ ProfileDashboard.tsx        # Tab thông tin / bảo mật / đơn hàng
│  └─ ui/
│     ├─ icons.tsx                   # Bộ icon SVG nội bộ (không cần thư viện)
│     └─ StarRating.tsx              # Hiển thị sao (hỗ trợ số lẻ)
│
├─ lib/
│  ├─ cars.ts                        # Model Car, dữ liệu mẫu, filter/sort, format VND
│  ├─ booking.ts                     # Showroom, khung giờ, validate form (dùng chung UI + mock API)
│  └─ api/                           # ★ Lớp kết nối backend (xem docs/API.md)
│     ├─ config.ts                   # API_CONFIG + ENDPOINTS (đổi base URL tại đây)
│     ├─ token.ts                    # Lưu/đọc token trong localStorage
│     ├─ http.ts                     # fetch wrapper: envelope, Bearer, timeout, ApiError
│     ├─ types.ts                    # DTO & payload TypeScript
│     ├─ index.ts                    # Barrel export
│     └─ services/                   # auth / cars / bookings / profile
│
├─ docs/
│  ├─ STRUCTURE.md                   # Tài liệu này
│  ├─ API.md                         # ★ Đặc tả API + hướng dẫn nối backend thật
│  └─ WIREFRAMES.md                  # Wireframe trang chủ & chi tiết xe
│
├─ tailwind.config.ts                # Design tokens: ink / champagne / cream
├─ next.config.mjs
├─ tsconfig.json
└─ package.json
```

## Quy ước

| Lớp | Trách nhiệm |
| --- | --- |
| `app/**/page.tsx` | Server Component: lấy dữ liệu, metadata, dựng khung trang |
| `components/**` | UI: chỉ component có state mới dùng `"use client"` |
| `lib/` | Dữ liệu, kiểu TypeScript, hàm thuần (filter, format, validate) |
| `docs/` | Tài liệu thiết kế, wireframe, luồng nghiệp vụ |

## Luồng Use Case → Route

| Use case | Route / Component |
| --- | --- |
| Đăng nhập / Đăng ký | `/login`, `/register` |
| Khôi phục mật khẩu | `/forgot-password` |
| Đổi mật khẩu | `/profile` → tab “Bảo mật & mật khẩu” |
| Quản lý hồ sơ | `/profile` → tab “Thông tin cá nhân” |
| Xem danh sách xe / tìm kiếm / lọc | `/cars` → `CarListView` |
| Chi tiết xe | `/cars/[slug]` |
| Đánh giá xe | `/cars/[slug]#danh-gia` → `ReviewSection` |
| Đặt cọc + kiểm tra tình trạng xe | `/cars/[slug]/deposit` → `DepositForm` |
| Thanh toán | `DepositForm` bước 2 (chọn phương thức + xác nhận) |
| Đặt lịch lái thử | `/cars/[slug]/test-drive` → `TestDriveForm` |

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # kiểm tra production build
```

## Ghi chú tích hợp backend

Toàn bộ UI đã gọi qua lớp connector `lib/api/**`. Mock backend nằm trong `app/api/**`.

| Chức năng | Service | Endpoint mock |
| --- | --- | --- |
| Kiểm tra tồn kho | `carsApi.checkAvailability` | `GET /api/cars/{slug}/availability` |
| Danh sách / chi tiết xe | `carsApi.list` / `getBySlug` | `GET /api/cars`, `GET /api/cars/{slug}` |
| Đánh giá xe | `carsApi.listReviews` / `createReview` | `GET|POST /api/cars/{slug}/reviews` |
| Đặt cọc | `depositsApi.create` | `POST /api/deposits` |
| Thanh toán | `paymentsApi.createIntent` + `confirm` | `POST /api/payments/intent`, `/api/payments/{id}/confirm` |
| Đặt lái thử | `testDrivesApi.create` / `slots` | `POST /api/test-drives`, `GET /api/test-drives/slots` |
| Đăng nhập / đăng ký / quên mật khẩu | `authApi.*` | `/api/auth/*` |
| Hồ sơ & đổi mật khẩu | `profileApi.*`, `authApi.changePassword` | `GET|PATCH /api/customers/me`, `POST /api/auth/change-password` |

Khi có backend thật: đổi `NEXT_PUBLIC_API_BASE_URL` trong `.env.local` (xem `.env.example`) và đặt
`NEXT_PUBLIC_USE_MOCK_API=false`. Chi tiết payload, mã lỗi và ví dụ curl: [`docs/API.md`](./API.md).

Tài khoản demo: `demo@autoweb.vn` / `Autoweb@123`.

