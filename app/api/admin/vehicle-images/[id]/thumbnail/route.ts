import { adminStore, requireAdmin } from "../../../../_lib/admin-store";
import { latency, notFound, ok } from "../../../../_lib/response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const target = adminStore.images.find((i) => i.id === id);
  if (!target) return notFound("Không tìm thấy ảnh.");
  for (const img of adminStore.images) {
    if (img.vehicleId === target.vehicleId) img.isThumbnail = img.id === target.id;
  }
  return ok(target, { message: "Đặt ảnh đại diện thành công" });
}
