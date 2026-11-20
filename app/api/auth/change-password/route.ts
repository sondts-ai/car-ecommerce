import { hashPassword } from "../../_lib/store";
import { fail, latency, ok, parseBody, requireUser, validationError } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** POST /api/auth/change-password */
export async function POST(request: Request) {
  await latency(260, 420);
  const auth = requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<{ currentPassword: string; newPassword: string }>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body JSON không hợp lệ.");

  const errors: Record<string, string> = {};
  if (!body.currentPassword) errors.currentPassword = "Vui lòng nhập mật khẩu hiện tại.";
  if ((body.newPassword ?? "").length < 8) errors.newPassword = "Mật khẩu mới phải có ít nhất 8 ký tự.";
  if (Object.keys(errors).length > 0) return validationError(errors);

  if (auth.user.passwordHash !== hashPassword(body.currentPassword)) {
    return fail(400, "INVALID_CREDENTIALS", "Mật khẩu hiện tại không đúng.", {
      currentPassword: "Mật khẩu hiện tại không đúng.",
    });
  }
  if (body.currentPassword === body.newPassword) {
    return fail(422, "VALIDATION_ERROR", "Mật khẩu mới phải khác mật khẩu hiện tại.", {
      newPassword: "Mật khẩu mới phải khác mật khẩu hiện tại.",
    });
  }

  auth.user.passwordHash = hashPassword(body.newPassword);
  auth.user.updatedAt = new Date().toISOString();
  return ok({ ok: true }, { message: "Mật khẩu đã được thay đổi." });
}
