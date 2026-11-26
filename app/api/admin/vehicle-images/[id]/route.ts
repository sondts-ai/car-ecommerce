import { adminStore, requireAdmin } from "../../../_lib/admin-store";
import { latency, notFound, ok } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.images.findIndex((i) => i.id === id);
  if (idx === -1) return notFound("Không tìm thấy ảnh.");
  adminStore.images.splice(idx, 1);
  return ok(null, { message: "Xóa ảnh thành công" });
}
