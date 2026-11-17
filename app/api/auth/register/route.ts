import { validateEmail, validateFullName, validatePhone } from "@/lib/booking";
import type { RegisterPayload } from "@/lib/api/types";
import { findUserByEmail, findUserByPhone, hashPassword, nowIso, store } from "../../_lib/store";
import { created, fail, latency, parseBody, validationError } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** POST /api/auth/register */
export async function POST(request: Request) {
  await latency(320, 520);
  const body = await parseBody<RegisterPayload>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body JSON không hợp lệ.");

  const errors: Record<string, string> = {};
  const nameError = validateFullName(body.fullName ?? "");
  if (nameError) errors.fullName = nameError;
  const phoneError = validatePhone(body.phone ?? "");
  if (phoneError) errors.phone = phoneError;
  const emailError = validateEmail(body.email ?? "", true);
  if (emailError) errors.email = emailError;
  if ((body.password ?? "").length < 8) errors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
  if (Object.keys(errors).length > 0) return validationError(errors);

  if (findUserByEmail(body.email)) {
    return fail(409, "EMAIL_TAKEN", "Email này đã được sử dụng.", { email: "Email đã tồn tại." });
  }
  if (findUserByPhone(body.phone)) {
    return fail(409, "CONFLICT", "Số điện thoại này đã được sử dụng.", {
      phone: "Số điện thoại đã tồn tại.",
    });
  }

  const userId = `usr_${Date.now().toString(36)}`;
  store.users.push({
    id: userId,
    fullName: body.fullName.trim(),
    email: body.email.trim().toLowerCase(),
    phone: body.phone.replace(/[\s.-]/g, ""),
    tier: "Bạc",
    joinedAt: nowIso(),
    newsletter: false,
    updatedAt: nowIso(),
    passwordHash: hashPassword(body.password),
  });

  return created({ userId, email: body.email.trim().toLowerCase() }, "Tạo tài khoản thành công.");
}
