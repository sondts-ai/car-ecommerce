import { validateFullName, validatePhone } from "@/lib/booking";
import type { UpdateProfilePayload } from "@/lib/api/types";
import { nowIso, toAuthUser } from "../../_lib/store";
import { latency, ok, parseBody, requireUser, validationError } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** GET /api/customers/me */
export async function GET(request: Request) {
  await latency(160, 280);
  const auth = requireUser(request);
  if ("response" in auth) return auth.response;
  return ok(toAuthUser(auth.user));
}

/** PATCH /api/customers/me */
export async function PATCH(request: Request) {
  await latency(220, 360);
  const auth = requireUser(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<UpdateProfilePayload>(request);
  if (!body) return validationError({}, "Body JSON không hợp lệ.");

  const errors: Record<string, string> = {};
  if (body.fullName !== undefined) {
    const error = validateFullName(body.fullName);
    if (error) errors.fullName = error;
  }
  if (body.phone !== undefined) {
    const error = validatePhone(body.phone);
    if (error) errors.phone = error;
  }
  if (Object.keys(errors).length > 0) return validationError(errors);

  const user = auth.user;
  if (body.fullName !== undefined) user.fullName = body.fullName.trim();
  if (body.phone !== undefined) user.phone = body.phone.replace(/[\s.-]/g, "");
  if (body.birthday !== undefined) user.birthday = body.birthday;
  if (body.address !== undefined) user.address = body.address;
  if (body.city !== undefined) user.city = body.city;
  if (body.newsletter !== undefined) user.newsletter = body.newsletter;
  user.updatedAt = nowIso();

  return ok(toAuthUser(user), { message: "Thông tin cá nhân đã được cập nhật." });
}
