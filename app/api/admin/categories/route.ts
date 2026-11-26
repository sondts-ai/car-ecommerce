import type { CategoryRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, paginate, requireAdmin } from "../../_lib/admin-store";
import { created, fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const filtered = adminStore.categories
    .filter((c) => (!q ? true : c.name.toLowerCase().includes(q)))
    .sort((a, b) => a.id - b.id);
  return ok(paginate(filtered, searchParams.get("page"), searchParams.get("size")), {
    message: "Danh sách phân loại",
  });
}

export async function POST(request: Request) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<CategoryRequest>(request);
  if (!body?.name?.trim()) return fail(400, "VALIDATION_ERROR", "Tên phân loại không được để trống.");
  const name = body.name.trim();
  if (adminStore.categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    return fail(409, "CONFLICT", `Phân loại "${name}" đã tồn tại.`);
  }
  const item = {
    id: adminStore.seq.category++,
    name,
    description: body.description?.trim() || null,
    createdAt: nowIso(),
  };
  adminStore.categories.push(item);
  return created(item, "Tạo phân loại thành công");
}
