import type { VehicleStatusChangeRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, requireAdmin } from "../../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../../_lib/response";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const vehicle = adminStore.vehicles.find((v) => v.id === id);
  if (!vehicle) return notFound("Không tìm thấy xe.");

  if (vehicle.status === "SOLD") {
    return fail(409, "CONFLICT", "Không thể thay đổi trạng thái của xe đã bán (SOLD).");
  }
  const body = await parseBody<VehicleStatusChangeRequest>(request);
  if (!body?.status) return fail(400, "VALIDATION_ERROR", "Trạng thái mới là bắt buộc.");

  const oldStatus = vehicle.status;
  vehicle.status = body.status;
  vehicle.updatedAt = nowIso();
  const entry = {
    id: adminStore.seq.history++,
    vehicleId: vehicle.id,
    oldStatus,
    newStatus: body.status,
    reason: body.reason?.trim() || "Cập nhật trạng thái",
    createdAt: vehicle.updatedAt,
  };
  adminStore.histories.push(entry);
  return ok(entry, { message: "Đổi trạng thái xe thành công" });
}
