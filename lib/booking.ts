export type Showroom = {
  id: string;
  name: string;
  city: string;
  address: string;
  hotline: string;
};

export const SHOWROOMS: Showroom[] = [
  {
    id: "hn-tay-ho",
    name: "AutoWeb Tây Hồ",
    city: "Hà Nội",
    address: "Số 2 Nguyễn Chí Thanh, Q. Tây Hồ",
    hotline: "024 7300 8686",
  },
  {
    id: "hcm-q7",
    name: "AutoWeb Phú Mỹ Hưng",
    city: "TP. Hồ Chí Minh",
    address: "Nguyễn Văn Linh, Q. 7",
    hotline: "028 7300 8686",
  },
  {
    id: "dn-hai-chau",
    name: "AutoWeb Đà Nẵng",
    city: "Đà Nẵng",
    address: "2 Tháng 9, Q. Hải Châu",
    hotline: "0236 7300 8686",
  },
];

export type AvailabilityStatus = "checking" | "available" | "unavailable";

export type AvailabilityResult = {
  status: AvailabilityStatus;
  unitsLeft: number;
  checkedAt: string;
  holdMinutes: number;
  note?: string;
};

/**
 * Mô phỏng API "Kiểm tra tình trạng xe" (UC: Check Vehicle Availability).
 * Thay thế bằng fetch("/api/cars/[slug]/availability") khi nối backend thật.
 */
export async function checkVehicleAvailability(slug: string): Promise<AvailabilityResult> {
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const { getCarBySlug } = await import("./cars");
  const car = getCarBySlug(slug);
  const unitsLeft = car?.stock ?? 0;

  return {
    status: unitsLeft > 0 ? "available" : "unavailable",
    unitsLeft,
    checkedAt: new Date().toISOString(),
    holdMinutes: 15,
    note:
      unitsLeft > 0
        ? "Xe đang trong kho và sẵn sàng giao trong 7–14 ngày."
        : "Mẫu xe này tạm hết hàng. Vui lòng để lại thông tin để nhận thông báo.",
  };
}

export type DepositAmountOption = {
  value: number;
  label: string;
  description: string;
};

export const DEPOSIT_OPTIONS: DepositAmountOption[] = [
  { value: 20_000_000, label: "20 triệu", description: "Mức cọc tiêu chuẩn, hoàn 100% trong 48 giờ" },
  { value: 50_000_000, label: "50 triệu", description: "Ưu tiên giữ xe, giảm 1% phí trước bạ" },
  { value: 100_000_000, label: "100 triệu", description: "Giữ xe 30 ngày, kèm gói phụ kiện chính hãng" },
];

export const PAYMENT_METHODS = [
  { id: "vnpay", name: "VNPAY QR", description: "Quét mã QR bằng ứng dụng ngân hàng" },
  { id: "visa", name: "Thẻ Visa / Mastercard", description: "Thanh toán bảo mật 3D-Secure" },
  { id: "transfer", name: "Chuyển khoản ngân hàng", description: "Xác nhận tự động trong 5 phút" },
  { id: "showroom", name: "Thanh toán tại showroom", description: "Giữ xe 24 giờ, thanh toán trực tiếp" },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function generateBookingCode(prefix: "DC" | "TD"): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(
    date.getDate(),
  ).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${stamp}-${random}`;
}

export const TEST_DRIVE_SLOTS = [
  "08:30",
  "09:30",
  "10:30",
  "11:30",
  "13:30",
  "14:30",
  "15:30",
  "16:30",
  "17:30",
];

/** Một vài khung giờ bị khoá để mô phỏng lịch showroom đã kín. */
export function isSlotUnavailable(isoDate: string, slot: string, showroomId: string): boolean {
  if (!isoDate) return false;
  const seed = [...`${isoDate}${slot}${showroomId}`].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return seed % 5 === 0;
}

export function toIsoDate(date: Date): string {
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 10);
}

export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return "—";
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export type FormErrors = Record<string, string>;

export function validateFullName(value: string): string | undefined {
  const name = value.trim();
  if (name.length < 3) return "Vui lòng nhập họ tên đầy đủ (tối thiểu 3 ký tự).";
  if (!/^[\p{L}\s.'-]+$/u.test(name)) return "Họ tên không được chứa số hoặc ký tự đặc biệt.";
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  const phone = value.replace(/[\s.-]/g, "");
  if (!/^0\d{9}$/.test(phone)) return "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.";
  return undefined;
}

export function validateEmail(value: string, required = false): string | undefined {
  const email = value.trim();
  if (!email) return required ? "Vui lòng nhập email." : undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Email không đúng định dạng.";
  return undefined;
}
