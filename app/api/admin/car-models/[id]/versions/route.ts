import type { CarVersionRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, requireAdmin } from "../../../../_lib/admin-store";
import { created, fail, latency, notFound, ok, parseBody } from "../../../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const modelId = Number((await context.params).id);
  if (!adminStore.models.some((m) => m.id === modelId)) {
    return notFound("Không tìm thấy dòng xe.");
  }
  const versions = adminStore.versions
    .filter((v) => v.modelId === modelId)
    .sort((a, b) => a.id - b.id);
  return ok(versions, { message: "Danh sách phiên bản" });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const modelId = Number((await context.params).id);
  if (!adminStore.models.some((m) => m.id === modelId)) {
    return notFound("Không tìm thấy dòng xe.");
  }

  const body = await parseBody<CarVersionRequest>(request);
  if (!body?.versionName?.trim()) {
    return fail(400, "VALIDATION_ERROR", "Tên phiên bản không được để trống.");
  }
  if (body.seats !== undefined && body.seats !== null && (body.seats < 2 || body.seats > 60)) {
    return fail(400, "VALIDATION_ERROR", "Số chỗ ngồi phải từ 2 đến 60.");
  }
  const version = {
    id: adminStore.seq.version++,
    modelId,
    versionName: body.versionName.trim(),
    engine: body.engine?.trim() || null,
    transmission: body.transmission ?? null,
    fuelType: body.fuelType ?? null,
    seats: body.seats ?? null,
    createdAt: nowIso(),
  };
  adminStore.versions.push(version);
  return created(version, "Tạo phiên bản thành công");
}
