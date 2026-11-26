import type { BrandRequest } from "@/lib/api/admin-types";
import { adminStore, requireAdmin } from "../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const brand = adminStore.brands.find((b) => b.id === id);
  if (!brand) return notFound("Không tìm thấy hãng xe.");
  return ok(brand, { message: "Chi tiết hãng xe" });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const brand = adminStore.brands.find((b) => b.id === id);
  if (!brand) return notFound("Không tìm thấy hãng xe.");

  const body = await parseBody<BrandRequest>(request);
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên hãng không được để trống.");
  const name = body.name.trim();
  if (adminStore.brands.some((b) => b.id !== id && b.name.toLowerCase() === name.toLowerCase())) {
    return fail(409, "CONFLICT", `Hãng xe "${name}" đã tồn tại.`);
  }
  brand.name = name;
  brand.logoUrl = body.logoUrl?.trim() || null;
  brand.description = body.description?.trim() || null;
  return ok(brand, { message: "Cập nhật hãng xe thành công" });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.brands.findIndex((b) => b.id === id);
  if (idx === -1) return notFound("Không tìm thấy hãng xe.");
  if (adminStore.models.some((m) => m.brandId === id)) {
    return fail(409, "CONFLICT", "Không thể xóa hãng xe vì vẫn còn dòng xe trực thuộc.");
  }
  adminStore.brands.splice(idx, 1);
  return ok(null, { message: "Xóa hãng xe thành công" });
}
