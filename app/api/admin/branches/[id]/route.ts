import type { BranchRequest } from "@/lib/api/admin-types";
import { adminStore, requireAdmin } from "../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const branch = adminStore.branches.find((b) => b.id === id);
  if (!branch) return notFound("Không tìm thấy chi nhánh.");

  const body = await parseBody<BranchRequest>(request);
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên chi nhánh không được để trống.");
  if (!body?.address?.trim()) return fail(400, "VALIDATION_ERROR", "Địa chỉ không được để trống.");
  branch.name = body.name.trim();
  branch.address = body.address.trim();
  branch.phone = body.phone?.trim() || null;
  return ok(branch, { message: "Cập nhật chi nhánh thành công" });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.branches.findIndex((b) => b.id === id);
  if (idx === -1) return notFound("Không tìm thấy chi nhánh.");
  if (adminStore.vehicles.some((v) => v.branchId === id)) {
    return fail(409, "CONFLICT", "Không thể xóa chi nhánh vì vẫn còn xe trong kho chi nhánh này.");
  }
  adminStore.branches.splice(idx, 1);
  return ok(null, { message: "Xóa chi nhánh thành công" });
}
