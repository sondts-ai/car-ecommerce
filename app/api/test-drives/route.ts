import { getCarBySlug } from "@/lib/cars";
import {
  SHOWROOMS,
  TEST_DRIVE_SLOTS,
  isSlotUnavailable,
  validateEmail,
  validateFullName,
  validatePhone,
} from "@/lib/booking";
import type { CreateTestDrivePayload, TestDriveDto } from "@/lib/api/types";
import { created, fail, getAuthUser, latency, ok, parseBody, validationError } from "../_lib/response";
import { generateCode, nowIso, store } from "../_lib/store";
import { isValidDateString } from "../_lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/test-drives — lịch hẹn của khách đang đăng nhập */
export async function GET(request: Request) {
  await latency(160, 280);
  const user = getAuthUser(request);
  if (!user) return fail(401, "UNAUTHORIZED", "Bạn cần đăng nhập để xem lịch hẹn.");

  const items = store.testDrives
    .filter(
      (item) =>
        item.customer.email?.toLowerCase() === user.email.toLowerCase() ||
        item.customer.phone === user.phone,
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return ok({ items });
}

/** POST /api/test-drives — UC: Đặt lịch lái thử */
export async function POST(request: Request) {
  await latency(320, 520);
  const body = await parseBody<CreateTestDrivePayload>(request);
  if (!body) return validationError({}, "Body JSON không hợp lệ.");

  const errors: Record<string, string> = {};
  const car = getCarBySlug(body.carSlug ?? "");
  if (!car) errors.carSlug = "Mẫu xe không tồn tại.";
  if (!SHOWROOMS.some((showroom) => showroom.id === body.showroomId)) {
    errors.showroomId = "Showroom không hợp lệ.";
  }
  if (!isValidDateString(body.date ?? "")) errors.date = "Ngày lái thử không hợp lệ.";
  if (!TEST_DRIVE_SLOTS.includes(body.time)) errors.time = "Khung giờ không hợp lệ.";
  if (!body.hasLicense) errors.hasLicense = "Bạn cần có giấy phép lái xe hợp lệ.";

  const customer = body.customer ?? { fullName: "", phone: "" };
  const nameError = validateFullName(customer.fullName ?? "");
  if (nameError) errors.fullName = nameError;
  const phoneError = validatePhone(customer.phone ?? "");
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(customer.email ?? "");
  if (emailError) errors.email = emailError;

  if (Object.keys(errors).length > 0) return validationError(errors);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selected = new Date(`${body.date}T00:00:00`);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 30);
  if (selected < today) return validationError({ date: "Không thể chọn ngày trong quá khứ." });
  if (selected > maxDate) return validationError({ date: "Chỉ nhận lịch trong vòng 30 ngày tới." });

  const conflict = store.testDrives.find(
    (item) =>
      item.carSlug === body.carSlug &&
      item.showroomId === body.showroomId &&
      item.date === body.date &&
      item.time === body.time &&
      item.status !== "cancelled",
  );
  if (conflict || isSlotUnavailable(body.date, body.time, body.showroomId)) {
    return fail(409, "CONFLICT", "Khung giờ này đã được đặt. Vui lòng chọn giờ khác.", {
      time: "Khung giờ đã kín.",
    });
  }

  const testDrive: TestDriveDto = {
    id: `td_${Date.now().toString(36)}`,
    code: generateCode("TD"),
    carSlug: body.carSlug,
    carName: car?.name ?? body.carSlug,
    showroomId: body.showroomId,
    date: body.date,
    time: body.time,
    note: body.note?.trim() || undefined,
    status: "pending",
    customer: {
      fullName: customer.fullName.trim(),
      phone: customer.phone.replace(/[\s.-]/g, ""),
      email: customer.email?.trim().toLowerCase() || undefined,
    },
    createdAt: nowIso(),
  };

  store.testDrives.unshift(testDrive);
  return created(testDrive, "Đã giữ lịch lái thử cho bạn.");
}
