import { getBearerToken, ok } from "../../_lib/response";
import { store } from "../../_lib/store";

export const dynamic = "force-dynamic";

/** POST /api/auth/logout */
export async function POST(request: Request) {
  const token = getBearerToken(request);
  if (token) store.sessions.delete(token);
  return ok({ ok: true }, { message: "Đã đăng xuất." });
}
