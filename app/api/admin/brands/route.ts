import type { BrandRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, paginate, requireAdmin } from "../../_lib/admin-store";
import { created, fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const filtered = adminStore.brands
    .filter((b) => (!q ? true : b.name.toLowerCase().includes(q)))
    .sort((a, b) => a.id - b.id);
  return ok(paginate(filtered, searchParams.get("page"), searchParams.get("size")), {
    message: "Danh sách hãng xe",
  });
}

export async function POST(request: Request) {
  await latency(100, 180);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<BrandRequest>(request);
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên hãng không được để trống.");
  const name = body.name.trim();
  if (adminStore.brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
    return fail(409, "CONFLICT", `Hãng xe "${name}" đã tồn tại.`);
  }
  const item = {
    id: adminStore.seq.brand++,
    name,
    logoUrl: body.logoUrl?.trim() || null,
    description: body.description?.trim() || null,
    createdAt: nowIso(),
  };
  adminStore.brands.push(item);
  return created(item, "Tạo hãng xe thành công");
}
