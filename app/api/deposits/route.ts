import { getCarBySlug } from "@/lib/cars";
import { SHOWROOMS, validateEmail, validateFullName, validatePhone } from "@/lib/booking";
import type { CreateDepositPayload, DepositDto } from "@/lib/api/types";
import { created, fail, getAuthUser, latency, notFound, ok, parseBody, validationError } from "../_lib/response";
import { generateCode, nowIso, store } from "../_lib/store";

export const dynamic = "force-dynamic";

const MIN_DEPOSIT = 10_000_000;

/** GET /api/deposits — danh sách đơn của khách đang đăng nhập */
export async function GET(request: Request) {
  await latency(180, 300);
  const user = getAuthUser(request);
  if (!user) return fail(401, "UNAUTHORIZED", "Bạn cần đăng nhập để xem đơn đặt cọc.");

  const items = store.deposits
    .filter(
      (deposit) =>
        deposit.customer.email?.toLowerCase() === user.email.toLowerCase() ||
        deposit.customer.phone === user.phone,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return ok({ items });
}

/** POST /api/deposits — UC: Tạo đơn đặt cọc */
export async function POST(request: Request) {
  await latency(320, 520);
  const body = await parseBody<CreateDepositPayload>(request);
  if (!body) return validationError({}, "Body JSON không hợp lệ.");

  const errors: Record<string, string> = {};
  const car = getCarBySlug(body.carSlug ?? "");
  if (!car) errors.carSlug = "Mẫu xe không tồn tại.";
  if (!SHOWROOMS.some((showroom) => showroom.id === body.showroomId)) {
    errors.showroomId = "Showroom không hợp lệ.";
  }

  const customer = body.customer ?? { fullName: "", phone: "" };
  const nameError = validateFullName(customer.fullName ?? "");
  if (nameError) errors.fullName = nameError;
  const phoneError = validatePhone(customer.phone ?? "");
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(customer.email ?? "");
  if (emailError) errors.email = emailError;

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < MIN_DEPOSIT) {
    errors.amount = "Số tiền đặt cọc tối thiểu là 10.000.000 ₫.";
  } else if (car && amount > car.price * 0.3) {
    errors.amount = "Số tiền đặt cọc không vượt quá 30% giá trị xe.";
  }

  if (Object.keys(errors).length > 0) return validationError(errors);
  if (!car) return notFound("Không tìm thấy mẫu xe.");

  // UC: Kiểm tra tình trạng xe ngay tại thời điểm tạo đơn
  if (car.stock <= 0) {
    return fail(409, "OUT_OF_STOCK", "Mẫu xe này vừa hết hàng. Vui lòng chọn mẫu khác.");
  }

  const deposit: DepositDto = {
    id: `dep_${Date.now().toString(36)}`,
    code: generateCode("DC"),
    carSlug: car.slug,
    carName: car.name,
    showroomId: body.showroomId,
    amount,
    note: body.note?.trim() || undefined,
    status: "pending_payment",
    customer: {
      fullName: customer.fullName.trim(),
      phone: customer.phone.replace(/[\s.-]/g, ""),
      email: customer.email?.trim().toLowerCase() || undefined,
    },
    createdAt: nowIso(),
    holdUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };

  store.deposits.unshift(deposit);
  return created(deposit, "Đã giữ xe cho bạn trong 15 phút.");
}
