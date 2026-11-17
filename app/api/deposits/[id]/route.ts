import { notFound, ok, requireUser } from "../../_lib/response";
import { store } from "../../_lib/store";

export const dynamic = "force-dynamic";

/** GET /api/deposits/{id} */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const deposit = store.deposits.find((item) => item.id === id || item.code === id);
  if (!deposit) return notFound("Không tìm thấy đơn đặt cọc.");

  const isOwner =
    deposit.customer.email?.toLowerCase() === auth.user.email.toLowerCase() ||
    deposit.customer.phone === auth.user.phone;
  if (!isOwner) return notFound("Không tìm thấy đơn đặt cọc.");

  return ok(deposit);
}
