import type { VehicleCreateRequest } from "@/lib/api/admin-types";
import {
  adminStore,
  nowIso,
  paginate,
  requireAdmin,
  toVehicleDetail,
  toVehicleSummary,
} from "../../_lib/admin-store";
import { created, fail, latency, ok, parseBody } from "../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "";
  const branchId = Number(searchParams.get("branchId") || 0) || null;
  const versionId = Number(searchParams.get("versionId") || 0) || null;
  const condition = searchParams.get("condition") || "";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null;
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  const filtered = adminStore.vehicles
    .filter((v) => {
      if (status && v.status !== status) return false;
      if (branchId && v.branchId !== branchId) return false;
      if (versionId && v.versionId !== versionId) return false;
      if (condition && v.condition !== condition) return false;
      if (minPrice !== null && v.price < minPrice) return false;
      if (maxPrice !== null && v.price > maxPrice) return false;
      if (q) {
        const vinMatch = v.vin.toLowerCase().includes(q);
        const plateMatch = (v.licensePlate ?? "").toLowerCase().includes(q);
        if (!vinMatch && !plateMatch) return false;
      }
      return true;
    })
    .sort((a, b) => a.id - b.id)
    .map(toVehicleSummary);

  return ok(paginate(filtered, searchParams.get("page"), searchParams.get("size")), {
    message: "Danh sách xe",
  });
}

export async function POST(request: Request) {
  await latency(100, 180);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const body = await parseBody<VehicleCreateRequest>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body không hợp lệ.");
  if (!adminStore.versions.some((v) => v.id === body.versionId)) {
    return fail(400, "VALIDATION_ERROR", "Phiên bản xe (versionId) không tồn tại.");
  }
  if (!adminStore.branches.some((b) => b.id === body.branchId)) {
    return fail(400, "VALIDATION_ERROR", "Chi nhánh (branchId) không tồn tại.");
  }
  const vin = (body.vin ?? "").trim().toUpperCase();
  if (vin.length !== 17) return fail(400, "VALIDATION_ERROR", "VIN phải đúng 17 ký tự.");
  if (adminStore.vehicles.some((v) => v.vin.toUpperCase() === vin)) {
    return fail(409, "CONFLICT", `Số VIN "${vin}" đã tồn tại trong hệ thống.`);
  }
  if (body.year < 1900 || body.year > 2100) {
    return fail(400, "VALIDATION_ERROR", "Năm sản xuất phải từ 1900 đến 2100.");
  }
  if (body.price < 0) return fail(400, "VALIDATION_ERROR", "Giá xe không được âm.");

  const now = nowIso();
  const record = {
    id: adminStore.seq.vehicle++,
    versionId: body.versionId,
    branchId: body.branchId,
    vin,
    licensePlate: body.licensePlate?.trim() || null,
    condition: body.condition,
    year: body.year,
    color: body.color?.trim() || null,
    mileage: body.condition === "NEW" ? 0 : Math.max(0, body.mileage ?? 0),
    price: body.price,
    description: body.description?.trim() || null,
    status: "AVAILABLE" as const,
    createdAt: now,
    updatedAt: now,
  };
  adminStore.vehicles.push(record);
  adminStore.histories.push({
    id: adminStore.seq.history++,
    vehicleId: record.id,
    oldStatus: null,
    newStatus: "AVAILABLE",
    reason: "Nhập xe",
    createdAt: now,
  });

  return created(toVehicleDetail(record), "Nhập xe thành công");
}
