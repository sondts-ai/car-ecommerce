import { store } from "../../_lib/store";
import { fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** POST /api/auth/verify-otp */
export async function POST(request: Request) {
  await latency(200, 340);
  const body = await parseBody<{ email: string; otp: string }>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body JSON không hợp lệ.");

  const email = (body.email ?? "").trim().toLowerCase();
  const record = store.otps.get(email);

  if (!record) return fail(400, "OTP_INVALID", "Chưa có mã xác thực cho email này.");
  if (Date.now() > record.expiresAt) {
    store.otps.delete(email);
    return fail(400, "OTP_INVALID", "Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.");
  }
  if (record.otp !== (body.otp ?? "").trim()) {
    return fail(400, "OTP_INVALID", "Mã xác thực không đúng.", { otp: "Mã xác thực không đúng." });
  }

  record.resetToken = `rst_${Math.random().toString(36).slice(2, 12)}`;
  return ok({ verified: true, resetToken: record.resetToken });
}
