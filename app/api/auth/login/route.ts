import { validateEmail } from "@/lib/booking";
import type { LoginPayload } from "@/lib/api/types";
import { createSession, findUserByEmail, findUserByPhone, hashPassword } from "../../_lib/store";
import { fail, latency, ok, parseBody, validationError } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** POST /api/auth/login */
export async function POST(request: Request) {
  await latency(240, 420);
  const body = await parseBody<LoginPayload>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body JSON không hợp lệ.");

  const identifier = (body.identifier ?? "").trim();
  const password = body.password ?? "";

  const errors: Record<string, string> = {};
  if (!identifier) errors.identifier = "Vui lòng nhập email hoặc số điện thoại.";
  if (!password) errors.password = "Vui lòng nhập mật khẩu.";
  if (Object.keys(errors).length > 0) return validationError(errors);

  const user = identifier.includes("@") ? findUserByEmail(identifier) : findUserByPhone(identifier);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return fail(401, "INVALID_CREDENTIALS", "Email/số điện thoại hoặc mật khẩu không đúng.");
  }

  const accessToken = createSession(user.id);
  const { passwordHash: _passwordHash, ...authUser } = user;

  return ok(
    {
      accessToken,
      refreshToken: `${accessToken}.refresh`,
      expiresIn: 60 * 60 * 24,
      user: authUser,
    },
    { message: `Chào mừng trở lại, ${user.fullName}!` },
  );
}

/** Gợi ý cho dev/test */
export async function GET() {
  const emailError = validateEmail("demo@autoweb.vn", true);
  return ok({
    hint: "Tài khoản demo: demo@autoweb.vn / Autoweb@123",
    valid: !emailError,
  });
}
