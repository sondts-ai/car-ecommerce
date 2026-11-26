import { latency, ok, requireUser } from "../../_lib/response";
import { toAuthUser } from "../../_lib/store";

export const dynamic = "force-dynamic";

/** GET /api/auth/me — trả thông tin tài khoản hiện tại kèm role */
export async function GET(request: Request) {
  await latency(80, 160);
  const auth = requireUser(request);
  if ("response" in auth) return auth.response;
  return ok(toAuthUser(auth.user));
}
