# Wireframe & luồng UX — AutoWeb Customer

## Nguyên tắc thiết kế

- **Phong cách**: luxury automotive — nền than chì `#0E1013`, điểm nhấn vàng champagne `#C9A96A`, nền kem `#F5F2EC`, chữ tiêu đề serif (Playfair Display), nội dung sans (Inter).
- **Nhịp điệu**: mỗi màn hình mở bằng “eyebrow” nhỏ + tiêu đề serif lớn, kết thúc bằng một CTA vàng.
- **Tương phản**: khối tối dùng cho hero/CTA/quy trình, khối sáng dùng cho nội dung cần đọc kỹ (bảng giá, thông số, form).
- **Breakpoint**: mobile 1 cột → tablet 2 cột → desktop 12 cột (tối đa 1240px).

---

## 1. Trang chủ (`/`)

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER  ○ AUTOWEB   Trang chủ  Bộ sưu tập  Lái thử  [Đăng nhập] [Đặt lịch] │  sticky, nền ink-950
├──────────────────────────────────────────────────────────────┤
│ HERO (nền tối + quầng vàng)                                  │
│ ┌───────────────────────────┐  ┌───────────────────────────┐ │
│ │ EYEBROW: Hệ thống KD ô tô │  │                           │ │
│ │ H1: Hành trình đẳng cấp   │  │   ẢNH XE NỔI BẬT (16:11)  │ │
│ │     bắt đầu từ đây        │  │   + giá + rating overlay  │ │
│ │ mô tả ngắn (2 dòng)       │  │                           │ │
│ │ [Khám phá bộ sưu tập]     │  └───────────────────────────┘ │
│ │ [Đặt lịch lái thử]        │                                │
│ │ 200+ xe | 18 showroom | 4.9/5                                │
│ └───────────────────────────┘                                │
├──────────────────────────────────────────────────────────────┤
│ QUICK SEARCH (card trắng nổi lên, đè lên hero)               │
│ [ Tìm kiếm........ ] [Loại xe ▾] [Nhiên liệu ▾] [ Tìm xe ]   │
├──────────────────────────────────────────────────────────────┤
│ MẪU XE ĐƯỢC YÊU THÍCH                    [Xem tất cả xe →]   │
│ ┌────────┐ ┌────────┐ ┌────────┐                             │
│ │ Card 1 │ │ Card 2 │ │ Card 3 │   ảnh 16:10, tên, giá,      │
│ └────────┘ └────────┘ └────────┘   rating, 3 thông số, CTA  │
├──────────────────────────────────────────────────────────────┤
│ VÌ SAO CHỌN AUTOWEB (nền kem, 4 thẻ icon)                    │
│ [Chính hãng] [Trải nghiệm] [Đặt cọc 3'] [Lái thử tận nơi]    │
├──────────────────────────────────────────────────────────────┤
│ MỚI VỀ SHOWROOM (2 cột, ảnh nhỏ bên trái + thông tin phải)   │
├──────────────────────────────────────────────────────────────┤
│ QUY TRÌNH 4 BƯỚC (nền tối) 01 → 02 → 03 → 04                 │
├──────────────────────────────────────────────────────────────┤
│ CTA CUỐI: Đặt lịch lái thử + 3 cam kết                       │
├──────────────────────────────────────────────────────────────┤
│ FOOTER: logo, 2 cột link, newsletter, bản quyền              │
└──────────────────────────────────────────────────────────────┘
```

**Trạng thái & tương tác**

- Header trong suốt → nền đặc khi scroll > 12px.
- Menu mobile dạng accordion dưới header.
- Quick search submit bằng `GET /cars` (hoạt động cả khi tắt JS).
- Card xe hover: nhấc lên 4px, viền vàng, ảnh zoom nhẹ, mũi tên đổi nền vàng.

---

## 2. Chi tiết xe (`/cars/[slug]`)

```
┌──────────────────────────────────────────────────────────────┐
│ BREADCRUMB  Trang chủ / Bộ sưu tập / Mercedes-Benz S 450      │
├──────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────┐  ┌───────────────────────┐ │
│ │ [brand] [SUV] [Đời 2025] [Còn 4 xe]                      │ │
│ │ H1: Mercedes-Benz S 450       │  │  GIÁ: 4.319.000.000 ₫ │ │
│ │ tagline                       │  │  (giá gốc gạch ngang)  │ │
│ │ ★★★★★ 4.9 (128 đánh giá)     │  │  Trả góp từ …/tháng   │ │
│ │                               │  │ ─────────────────────  │ │
│ │ ┌───────────────────────────┐ │  │  Đặt cọc từ 20 triệu  │ │
│ │ │   GALLERY ẢNH LỚN 4:3     │ │  │  ✔ Hoàn cọc 48 giờ    │ │
│ │ │   (badge 360°)            │ │  │ ─────────────────────  │ │
│ │ └───────────────────────────┘ │  │  [   ĐẶT CỌC XE   ]   │ │
│ │ Màu ngoại thất ● ● ● ● ● +3   │  │  [ĐẶT LỊCH LÁI THỬ]  │ │
│ │ Giao xe 7–14 ngày             │  │  ☎ 1900 8686          │ │
│ │                               │  │ ─────────────────────  │ │
│ │ [Nhiên liệu] [Công suất]      │  │  ✔ VAT, phí trọn gói  │ │
│ │ [Số chỗ]     [Hộp số]         │  │  ✔ Bảo hành 5 năm     │ │
│ │                               │  │  (sticky khi scroll)   │ │
│ │ GIỚI THIỆU + 4 điểm nổi bật   │  └───────────────────────┘ │
│ │ BẢNG THÔNG SỐ KỸ THUẬT        │                            │
│ │ ĐÁNH GIÁ: điểm TB + phân bố   │                            │
│ │ danh sách review + form sao   │                            │
│ └───────────────────────────────┘                            │
├──────────────────────────────────────────────────────────────┤
│ MẪU XE TƯƠNG TỰ (3 card)                                     │
└──────────────────────────────────────────────────────────────┘
```

**Ghi chú UX**

- Cột phải sticky (top 96px) để CTA luôn hiển thị — giảm số bước tới đặt cọc.
- Nếu `stock === 0`: nút “Đặt cọc” bị vô hiệu hoá, badge “Tạm hết hàng” màu hổ phách.
- Màu ngoại thất chỉ mang tính trực quan; khi nối API sẽ mở gallery theo màu.
- Form đánh giá: chọn sao bằng hover + click, bắt buộc tối thiểu 20 ký tự, hiển thị đếm ký tự.

---

## 3. Đặt cọc (`/cars/[slug]/deposit`) — 3 bước

```
┌──────────────────────────────────────────────────────────────┐
│ (1) Xác nhận xe & đặt cọc ─── (2) Thanh toán ─── (3) Hoàn tất │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  ┌───────────────────┐ │
│ │ ✔ Xe còn hàng · 4 chiếc · 14:59  │  │ ẢNH XE + TÊN XE   │ │
│ │   (banner tự kiểm tra khi mở)    │  ├───────────────────┤ │
│ ├──────────────────────────────────┤  │ Giá niêm yết      │ │
│ │ THÔNG TIN ĐẶT CỌC               │  │ Tiền đặt cọc      │ │
│ │ Họ tên*        SĐT*              │  │ ───────────────   │ │
│ │ Email                            │  │ Còn lại nhận xe   │ │
│ │ Showroom ▾ + địa chỉ + hotline   │  │ Nhận xe tại …     │ │
│ │ SỐ TIỀN CỌC: [20tr][50tr][100tr] │  │ Giữ xe 14:59      │ │
│ │ [Số tiền khác]                   │  └───────────────────┘ │
│ │ Ghi chú                          │  (sticky)              │
│ │ ☑ Điều khoản đặt cọc            │                        │
│ │ [← Quay lại]  [Tiếp tục thanh toán →]                     │
│ └──────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

**Kiểm tra tình trạng xe (UC: Check Vehicle Availability)**

1. Mount form → `checkVehicleAvailability(slug)` (loading 1.1s, spinner + “Đang kiểm tra…”).
2. `available` → banner xanh + số lượng còn lại + đếm ngược giữ xe 15 phút.
3. `unavailable` → banner hổ phách, chặn nút tiến bước, CTA “Xe tương tự” + “Kiểm tra lại”.
4. Bước 2: chọn VNPAY / Visa / Chuyển khoản / Tại showroom → nút xác nhận hiển thị số tiền.
5. Bước 3: mã đơn `DC-YYYYMMDD-XXXX`, tóm tắt giao dịch, CTA quản lý đơn.

**Validate**

- Họ tên ≥ 3 ký tự, không chứa số.
- SĐT: 10 số, bắt đầu bằng 0.
- Tiền cọc: 10 triệu ≤ x ≤ 30% giá xe.
- Bắt buộc tick điều khoản.

---

## 4. Đặt lịch lái thử (`/cars/[slug]/test-drive`)

```
┌──────────────────────────────────────────────────────────────┐
│ H1: Đặt lịch lái thử                                         │
├──────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  ┌───────────────────┐ │
│ │ Mẫu xe ▾        Showroom ▾       │  │ ẢNH XE + TÊN XE   │ │
│ │ ───────────────────────────────  │  ├───────────────────┤ │
│ │ NGÀY:  [T2 17][T3 18][T4 19]…    │  │ 📅 Thứ 5 20/11    │ │
│ │        (+ input date tuỳ chọn)   │  │    14:30 · 30 phút│ │
│ │ GIỜ:   [08:30][09:30][10:30]…    │  │ 📍 Showroom       │ │
│ │        (giờ kín bị gạch ngang)   │  │ ☎ Hotline         │ │
│ │ Họ tên*   SĐT*                   │  │ 👥 Tối đa 2 khách │ │
│ │ Email     Ghi chú                │  │ ✔ Miễn phí        │ │
│ │ ☑ Có GPLX   ☑ Điều khoản         │  │ ✔ Đổi lịch 6h     │ │
│ │ [Xác nhận đặt lịch →]            │  └───────────────────┘ │
│ └──────────────────────────────────┘                        │
└──────────────────────────────────────────────────────────────┘
```

- 14 ngày kế tiếp hiển thị dạng chip ngày; khung giờ kín được disable + `title`.
- Đổi showroom/ngày sẽ xoá lựa chọn giờ để tránh xung đột lịch.
- Thành công: mã `TD-YYYYMMDD-XXXX` + nhắc mang CCCD & GPLX.

---

## 5. Xác thực & hồ sơ

```
LOGIN / REGISTER / FORGOT PASSWORD
┌───────────────┬─────────────────────────┐
│ PANEL TỐI     │ FORM                    │
│ logo, quote   │ eyebrow + H1 + mô tả    │
│ 4 quyền lợi   │ các field + validate    │
│ badge bảo mật │ CTA vàng + link phụ     │
└───────────────┴─────────────────────────┘

PROFILE
┌──────────────┬──────────────────────────┐
│ AVATAR + hạng│ TABS: Thông tin | Bảo mật │
│ 3 tab điều    │ | Đơn hàng               │
│ hướng        │ form 2 cột + nút Lưu     │
│ quyền lợi    │ đổi mật khẩu + checklist  │
└──────────────┴──────────────────────────┘
```

---

## Responsive

| Khu vực | Mobile | Desktop |
| --- | --- | --- |
| Header | logo + nút hamburger, menu xổ xuống | nav ngang + 2 CTA |
| Danh sách xe | 1 cột, bộ lọc trong drawer bottom-sheet | sidebar 268px + lưới 2–3 cột |
| Chi tiết xe | 1 cột, CTA nằm cuối nội dung | 2 cột, cột phải sticky |
| Đặt cọc / lái thử | 1 cột, tóm tắt đưa xuống dưới | 2 cột, tóm tắt sticky |
| Profile | sidebar thành card ngang trên cùng | sidebar 280px cố định |
