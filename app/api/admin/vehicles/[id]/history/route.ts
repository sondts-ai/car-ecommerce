import { adminStore, requireAdmin } from "../../../../_lib/admin-store";
import { latency, notFound, ok } from "../../../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  if (!adminStore.vehicles.some((v) => v.id === id)) return notFound("Không tìm thấy xe.");
  const items = adminStore.histories
    .filter((h) => h.vehicleId === id)
    .sort((a, b) => b.id - a.id);
  return ok(items, { message: "Lịch sử trạng thái xe" });
}
