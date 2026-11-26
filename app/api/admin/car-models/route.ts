import type { CarModelRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, paginate, requireAdmin, toModelSummary } from "../../_lib/admin-store";
import { created, fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const brandId = Number(searchParams.get("brandId") || 0) || null;
  const categoryId = Number(searchParams.get("categoryId") || 0) || null;

  const filtered = adminStore.models
    .filter((m) => {
      if (brandId && m.brandId !== brandId) return false;
      if (categoryId && !m.categoryIds.includes(categoryId)) return false;
      if (q && !m.name.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => a.id - b.id)
    .map(toModelSummary);

  return ok(paginate(filtered, searchParams.get("page"), searchParams.get("size")), {
    message: "Danh sách dòng xe",
  });
}

export async function POST(request: Request) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<CarModelRequest>(request);
  if (!body?.brandId) return fail(400, "VALIDATION_ERROR", "brandId là bắt buộc.");
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên dòng xe không được để trống.");
  if (!adminStore.brands.some((b) => b.id === body.brandId)) {
    return fail(404, "NOT_FOUND", "Không tìm thấy hãng xe.");
  }
  const name = body.name.trim();
  if (
    adminStore.models.some(
      (m) => m.brandId === body.brandId && m.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    return fail(409, "CONFLICT", `Dòng xe "${name}" đã tồn tại trong hãng này.`);
  }
  const record = {
    id: adminStore.seq.model++,
    brandId: body.brandId,
    name,
    description: body.description?.trim() || null,
    categoryIds: Array.from(new Set(body.categoryIds ?? [])),
    createdAt: nowIso(),
  };
  adminStore.models.push(record);
  return created(toModelSummary(record), "Tạo dòng xe thành công");
}
