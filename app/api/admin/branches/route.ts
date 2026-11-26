import type { BranchRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, paginate, requireAdmin } from "../../_lib/admin-store";
import { created, fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const filtered = adminStore.branches
    .filter(
      (b) =>
        !q ||
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q),
    )
    .sort((a, b) => a.id - b.id);
  return ok(paginate(filtered, searchParams.get("page"), searchParams.get("size")), {
    message: "Danh sách chi nhánh",
  });
}

export async function POST(request: Request) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<BranchRequest>(request);
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên chi nhánh không được để trống.");
  if (!body?.address?.trim()) return fail(400, "VALIDATION_ERROR", "Địa chỉ không được để trống.");
  const item = {
    id: adminStore.seq.branch++,
    name: body.name.trim(),
    address: body.address.trim(),
    phone: body.phone?.trim() || null,
    createdAt: nowIso(),
  };
  adminStore.branches.push(item);
  return created(item, "Tạo chi nhánh thành công");
}
