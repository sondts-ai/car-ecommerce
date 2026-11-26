import type { CarVersionRequest } from "@/lib/api/admin-types";
import { adminStore, requireAdmin } from "../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const version = adminStore.versions.find((v) => v.id === id);
  if (!version) return notFound("Không tìm thấy phiên bản.");

  const body = await parseBody<CarVersionRequest>(request);
  if (!body?.versionName?.trim()) {
    return fail(400, "VALIDATION_ERROR", "Tên phiên bản không được để trống.");
  }
  if (body.seats !== undefined && body.seats !== null && (body.seats < 2 || body.seats > 60)) {
    return fail(400, "VALIDATION_ERROR", "Số chỗ ngồi phải từ 2 đến 60.");
  }
  version.versionName = body.versionName.trim();
  version.engine = body.engine?.trim() || null;
  version.transmission = body.transmission ?? null;
  version.fuelType = body.fuelType ?? null;
  version.seats = body.seats ?? null;
  return ok(version, { message: "Cập nhật phiên bản thành công" });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.versions.findIndex((v) => v.id === id);
  if (idx === -1) return notFound("Không tìm thấy phiên bản.");
  if (adminStore.vehicles.some((v) => v.versionId === id)) {
    return fail(409, "CONFLICT", "Không thể xóa phiên bản vì vẫn còn xe đang thuộc phiên bản này.");
  }
  adminStore.versions.splice(idx, 1);
  return ok(null, { message: "Xóa phiên bản thành công" });
}
