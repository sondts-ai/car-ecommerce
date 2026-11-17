# AutoWeb — Cổng khách hàng hệ thống kinh doanh ô tô

Giao diện khách hàng (Customer) được xây dựng bằng **Next.js 15 (App Router) + TypeScript + Tailwind CSS**, phong cách luxury automotive: nền than chì, điểm nhấn vàng champagne, typography serif.

## Tính năng

| Nhóm | Màn hình / luồng |
| --- | --- |
| Xác thực & bảo mật | `/login`, `/register`, `/forgot-password` (OTP 2 bước), đổi mật khẩu trong `/profile` |
| Hồ sơ | `/profile` — thông tin cá nhân, bảo mật, đơn hàng & lịch hẹn |
| Khám phá & mua sắm | `/cars` (tìm kiếm + bộ lọc + sắp xếp), `/cars/[slug]` (chi tiết, thông số, đánh giá sao) |
| Giao dịch | `/cars/[slug]/deposit` — kiểm tra tồn kho tự động, chọn mức cọc, thanh toán, xác nhận |
| Đặt hẹn | `/cars/[slug]/test-drive` — chọn ngày, giờ, showroom, mẫu xe |

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Tài liệu

- [`docs/STRUCTURE.md`](docs/STRUCTURE.md) — cấu trúc thư mục, quy ước, map use case → route.
- [`docs/WIREFRAMES.md`](docs/WIREFRAMES.md) — wireframe trang chủ, chi tiết xe, đặt cọc, lái thử, auth.
- [`docs/API.md`](docs/API.md) — đặc tả API, envelope, mã lỗi, ví dụ curl, hướng dẫn nối backend thật.

## Công nghệ

- Next.js 15.5 (App Router, SSG cho danh mục xe), React 19
- Tailwind CSS 3.4 với design tokens tuỳ chỉnh (`ink`, `champagne`, `cream`)
- Không dùng thư viện UI ngoài: icon SVG nội bộ tại `components/ui/icons.tsx`
- Ảnh xe minh hoạ bằng SVG + gradient (không phụ thuộc CDN, không lo ảnh hỏng)

## Ghi chú

- Dữ liệu xe & API đang là mock trong `lib/cars.ts` và `lib/booking.ts`; các điểm cần thay bằng API thật được đánh dấu `TODO`.
- Project Java mẫu ban đầu (`src/App.java`, `lib/`) vẫn được giữ nguyên.
