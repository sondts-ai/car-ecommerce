import { randomInt } from "node:crypto";
import { validateEmail } from "@/lib/booking";
import { findUserByEmail, store } from "../../_lib/store";
import { fail, latency, ok, parseBody, validationError } from "../../_lib/response";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/forgot-password
 * Mock trả về `devOtp` để test; backend thật chỉ gửi OTP qua email/SMS.
 */
export async function POST(request: Request) {
  await latency(260, 420);
  const body = await parseBody<{ email: string }>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body JSON không hợp lệ.");

  const emailError = validateEmail(body.email ?? "", true);
  if (emailError) return validationError({ email: emailError });

  const email = body.email.trim().toLowerCase();
  const otp = String(randomInt(100000, 1000000));
  store.otps.set(email, { email, otp, expiresAt: Date.now() + 10 * 60 * 1000 });

  const exists = Boolean(findUserByEmail(email));
  return ok(
    {
      email,
      expiresInMinutes: 10,
      devOtp: otp,
      accountExists: exists,
    },
    {
      message: exists
        ? "Mã xác thực đã được gửi tới email của bạn."
        : "Nếu email tồn tại trong hệ thống, mã xác thực sẽ được gửi đi.",
    },
  );
}
