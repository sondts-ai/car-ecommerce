import { store } from "../../_lib/store";
import { fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** POST /api/auth/reset-password — đặt lại mật khẩu bằng OTP */
export async function POST(request: Request) {
  await latency(260, 420);
  const body = await parseBody<{ email: string; otp: string; newPassword: string }>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body JSON không hợp lệ.");

  const email = (body.email ?? "").trim().toLowerCase();
  const record = store.otps.get(email);

  if (!record) return fail(400, "OTP_INVALID", "Yêu cầu không hợp lệ hoặc đã hết hạn.");
  if (record.otp !== (body.otp ?? "").trim()) {
    return fail(400, "OTP_INVALID", "Mã xác thực không đúng.", { otp: "Mã xác thực không đúng." });
  }
  if ((body.newPassword ?? "").length < 8) {
    return fail(422, "VALIDATION_ERROR", "Mật khẩu mới phải có ít nhất 8 ký tự.", {
      newPassword: "Tối thiểu 8 ký tự.",
    });
  }

  const user = store.users.find((item) => item.email.toLowerCase() === email);
  if (user) {
    const { hashPassword } = await import("../../_lib/store");
    user.passwordHash = hashPassword(body.newPassword);
    user.updatedAt = new Date().toISOString();
  }

  store.otps.delete(email);
  return ok({ ok: true }, { message: "Đặt lại mật khẩu thành công." });
}
