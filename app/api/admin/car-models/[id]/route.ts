import type { CarModelRequest } from "@/lib/api/admin-types";
import { adminStore, requireAdmin, toModelDetail, toModelSummary } from "../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const model = adminStore.models.find((m) => m.id === id);
  if (!model) return notFound("Không tìm thấy dòng xe.");
  return ok(toModelDetail(model), { message: "Chi tiết dòng xe" });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const model = adminStore.models.find((m) => m.id === id);
  if (!model) return notFound("Không tìm thấy dòng xe.");

  const body = await parseBody<CarModelRequest>(request);
  if (!body?.brandId) return fail(400, "VALIDATION_ERROR", "brandId là bắt buộc.");
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên dòng xe không được để trống.");
  model.brandId = body.brandId;
  model.name = body.name.trim();
  model.description = body.description?.trim() || null;
  model.categoryIds = Array.from(new Set(body.categoryIds ?? []));
  return ok(toModelSummary(model), { message: "Cập nhật dòng xe thành công" });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.models.findIndex((m) => m.id === id);
  if (idx === -1) return notFound("Không tìm thấy dòng xe.");
  if (adminStore.versions.some((v) => v.modelId === id)) {
    return fail(409, "CONFLICT", "Không thể xóa dòng xe vì vẫn còn phiên bản trực thuộc.");
  }
  adminStore.models.splice(idx, 1);
  return ok(null, { message: "Xóa dòng xe thành công" });
}
