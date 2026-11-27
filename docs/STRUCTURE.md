# Cấu trúc dự án — AutoWeb (Next.js 15 + Tailwind CSS)

Frontend gồm 2 khu tách biệt bằng route group:

- **Khu khách hàng** — `app/(user)/…` + `components/site/…` (URL: `/`, `/cars`, `/login`…)
- **Khu quản trị** — `app/admin/…` + `components/admin/…` (URL: `/admin`, `/admin/brands`…)

Root layout chỉ giữ `html/body/font`; mỗi khu có layout riêng nên không còn
header/footer khách hàng lẫn vào trang admin.

```
AutoWeb/
├─ app/                              # Next.js App Router
│  ├─ layout.tsx                     # Root layout: html/body/font (dùng chung user + admin)
│  ├─ globals.css                    # Tailwind + design tokens (ink/champagne/cream)
│  ├─ not-found.tsx                  # 404 toàn cục
│  │
│  ├─ (user)/                        # Route group — URL không đổi (khu khách hàng)
│  │  ├─ layout.tsx                  # SiteHeader + <main> + SiteFooter
│  │  ├─ not-found.tsx               # 404 trong khu khách hàng
│  │  ├─ page.tsx                    # Trang chủ (hero, tìm kiếm nhanh, xe nổi bật…)
│  │  ├─ cars/
│  │  │  ├─ page.tsx                 # Danh sách xe + bộ lọc (?q=&bodyType=…)
│  │  │  └─ [slug]/
│  │  │     ├─ page.tsx              # Chi tiết xe + đánh giá + CTA
│  │  │     ├─ deposit/page.tsx      # Luồng đặt cọc
│  │  │     └─ test-drive/page.tsx   # Luồng đặt lịch lái thử
│  │  ├─ login/page.tsx              # Đăng nhập
│  │  ├─ register/page.tsx           # Đăng ký
│  │  ├─ forgot-password/page.tsx    # Khôi phục mật khẩu (OTP 2 bước)
│  │  └─ profile/page.tsx            # Hồ sơ: thông tin, đổi mật khẩu, đơn hàng
│  │
│  ├─ admin/                         # Khu quản trị — URL /admin/*
│  │  ├─ layout.tsx                  # AdminGuard (kiểm tra role ADMIN)
│  │  ├─ login/page.tsx              # Đăng nhập admin (không bọc sidebar)
│  │  ├─ page.tsx                    # Dashboard & thống kê
│  │  ├─ brands/page.tsx
│  │  ├─ categories/page.tsx
│  │  ├─ car-models/page.tsx
│  │  ├─ vehicles/{page.tsx,[id]/page.tsx}
│  │  ├─ branches/page.tsx
│  │  ├─ orders/page.tsx              # Quản lý đơn đặt cọc
│  │  └─ test-drives/page.tsx         # Quản lý lịch lái thử
│  │
│  └─ api/                           # Mock backend (Next.js Route Handlers)
│     ├─ _lib/                       # store.ts, admin-store.ts, response.ts, validators.ts
│     ├─ health/route.ts
│     ├─ auth/{login,register,logout,forgot-password,verify-otp,reset-password,change-password}/route.ts
│     ├─ customers/me/route.ts
│     ├─ cars/…, deposits/…, payments/…, test-drives/…
│     └─ admin/…                      # Mock admin APIs (khi tắt backend thật)
│
├─ components/
│  ├─ site/                          # UI khu khách hàng
│  │  ├─ layout/
│  │  │  ├─ SiteHeader.tsx           # Header sticky, menu mobile
│  │  │  └─ SiteFooter.tsx           # Footer 4 cột + newsletter
│  │  ├─ cars/                       # CarListView, CarCard, CarVisual, ReviewSection
│  │  ├─ booking/                    # DepositForm, TestDriveForm
│  │  ├─ auth/                       # AuthShell, LoginForm, RegisterForm, ForgotPasswordForm
│  │  ├─ profile/                    # ProfileDashboard
│  │  └─ NotFoundContent.tsx         # 404 dùng chung
│  ├─ admin/                         # UI khu quản trị
│  │  ├─ AdminGuard.tsx              # Chặn truy cập nếu không phải ADMIN
│  │  ├─ AdminShell.tsx              # Sidebar + topbar
│  │  └─ AdminUi.tsx                 # Modal, pagination, banner, format helpers
│  └─ ui/                            # Component dùng chung
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
| Quản lý đơn đặt cọc | `/admin/orders` → Order Service / mock admin API |
| Quản lý lịch lái thử | `/admin/test-drives` → Customer Service / mock admin API |

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

