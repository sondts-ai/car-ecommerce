import type { VehicleImageRequest } from "@/lib/api/admin-types";
import { adminStore, requireAdmin } from "../../../../_lib/admin-store";
import { created, fail, latency, notFound, parseBody } from "../../../../_lib/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const vehicleId = Number((await context.params).id);
  if (!adminStore.vehicles.some((v) => v.id === vehicleId)) return notFound("Không tìm thấy xe.");

  const body = await parseBody<VehicleImageRequest>(request);
  if (!body?.imageUrl?.trim()) return fail(400, "VALIDATION_ERROR", "imageUrl không được để trống.");

  const makeThumb = Boolean(body.isThumbnail);
  if (makeThumb) {
    for (const img of adminStore.images) {
      if (img.vehicleId === vehicleId) img.isThumbnail = false;
    }
  }
  const existing = adminStore.images.filter((i) => i.vehicleId === vehicleId);
  const item = {
    id: adminStore.seq.image++,
    vehicleId,
    imageUrl: body.imageUrl.trim(),
    isThumbnail: makeThumb || existing.length === 0,
    sortOrder: body.sortOrder ?? existing.length + 1,
  };
  adminStore.images.push(item);
  return created(item, "Thêm ảnh thành công");
}
