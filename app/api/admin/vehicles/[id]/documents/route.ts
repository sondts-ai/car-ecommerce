import type { VehicleDocumentRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, requireAdmin } from "../../../../_lib/admin-store";
import { created, fail, latency, notFound, parseBody } from "../../../../_lib/response";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const vehicleId = Number((await context.params).id);
  if (!adminStore.vehicles.some((v) => v.id === vehicleId)) return notFound("Không tìm thấy xe.");

  const body = await parseBody<VehicleDocumentRequest>(request);
  if (!body?.documentType) return fail(400, "VALIDATION_ERROR", "documentType là bắt buộc.");
  if (!body?.fileUrl?.trim()) return fail(400, "VALIDATION_ERROR", "fileUrl không được để trống.");

  const item = {
    id: adminStore.seq.document++,
    vehicleId,
    documentType: body.documentType,
    fileUrl: body.fileUrl.trim(),
    createdAt: nowIso(),
  };
  adminStore.documents.push(item);
  return created(item, "Thêm giấy tờ thành công");
}
