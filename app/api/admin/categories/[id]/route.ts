import type { CategoryRequest } from "@/lib/api/admin-types";
import { adminStore, requireAdmin } from "../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const cat = adminStore.categories.find((c) => c.id === id);
  if (!cat) return notFound("Không tìm thấy phân loại.");

  const body = await parseBody<CategoryRequest>(request);
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên phân loại không được để trống.");
  const name = body.name.trim();
  if (adminStore.categories.some((c) => c.id !== id && c.name.toLowerCase() === name.toLowerCase())) {
    return fail(409, "CONFLICT", `Phân loại "${name}" đã tồn tại.`);
  }
  cat.name = name;
  cat.description = body.description?.trim() || null;
  return ok(cat, { message: "Cập nhật phân loại thành công" });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.categories.findIndex((c) => c.id === id);
  if (idx === -1) return notFound("Không tìm thấy phân loại.");
  adminStore.categories.splice(idx, 1);
  // Gỡ phân loại khỏi các dòng xe giống car-service
  for (const m of adminStore.models) {
    m.categoryIds = m.categoryIds.filter((cid) => cid !== id);
  }
  return ok(null, { message: "Xóa phân loại thành công" });
}
