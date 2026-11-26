import type { VehicleBranchChangeRequest } from "@/lib/api/admin-types";
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

  const body = await parseBody<VehicleBranchChangeRequest>(request);
  if (!body?.branchId) return fail(400, "VALIDATION_ERROR", "branchId là bắt buộc.");
  const targetBranch = adminStore.branches.find((b) => b.id === body.branchId);
  if (!targetBranch) return notFound("Không tìm thấy chi nhánh đích.");

  const oldBranch = adminStore.branches.find((b) => b.id === vehicle.branchId);
  vehicle.branchId = targetBranch.id;
  vehicle.updatedAt = nowIso();

  const note = body.reason?.trim() ? `: ${body.reason.trim()}` : "";
  const entry = {
    id: adminStore.seq.history++,
    vehicleId: vehicle.id,
    oldStatus: vehicle.status,
    newStatus: vehicle.status,
    reason: `Chuyển chi nhánh từ ${oldBranch?.name ?? "N/A"} sang ${targetBranch.name}${note}`,
    createdAt: vehicle.updatedAt,
  };
  adminStore.histories.push(entry);
  return ok(entry, { message: "Chuyển chi nhánh thành công" });
}
