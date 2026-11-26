import type { VehicleUpdateRequest } from "@/lib/api/admin-types";
import { adminStore, nowIso, requireAdmin, toVehicleDetail } from "../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const vehicle = adminStore.vehicles.find((v) => v.id === id);
  if (!vehicle) return notFound("Không tìm thấy xe.");
  return ok(toVehicleDetail(vehicle), { message: "Chi tiết xe" });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 160);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const vehicle = adminStore.vehicles.find((v) => v.id === id);
  if (!vehicle) return notFound("Không tìm thấy xe.");

  const body = await parseBody<VehicleUpdateRequest>(request);
  if (!body) return fail(400, "VALIDATION_ERROR", "Body không hợp lệ.");
  const vin = (body.vin ?? "").trim().toUpperCase();
  if (vin.length !== 17) return fail(400, "VALIDATION_ERROR", "VIN phải đúng 17 ký tự.");
  if (adminStore.vehicles.some((v) => v.id !== id && v.vin.toUpperCase() === vin)) {
    return fail(409, "CONFLICT", `Số VIN "${vin}" đã tồn tại.`);
  }
  if (vehicle.status === "SOLD" && body.price !== vehicle.price) {
    return fail(409, "CONFLICT", "Không thể sửa giá của xe đã bán (SOLD).");
  }

  vehicle.versionId = body.versionId;
  vehicle.vin = vin;
  vehicle.licensePlate = body.licensePlate?.trim() || null;
  vehicle.condition = body.condition;
  vehicle.year = body.year;
  vehicle.color = body.color?.trim() || null;
  vehicle.mileage = body.condition === "NEW" ? 0 : Math.max(0, body.mileage ?? 0);
  vehicle.price = body.price;
  vehicle.description = body.description?.trim() || null;
  vehicle.updatedAt = nowIso();
  return ok(toVehicleDetail(vehicle), { message: "Cập nhật xe thành công" });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  const id = Number((await context.params).id);
  const idx = adminStore.vehicles.findIndex((v) => v.id === id);
  if (idx === -1) return notFound("Không tìm thấy xe.");
  const vehicle = adminStore.vehicles[idx];
  if (vehicle.status === "RESERVED" || vehicle.status === "SOLD") {
    return fail(409, "CONFLICT", "Không thể xóa xe đang được giữ chỗ (RESERVED) hoặc đã bán (SOLD).");
  }
  adminStore.vehicles.splice(idx, 1);
  adminStore.images = adminStore.images.filter((i) => i.vehicleId !== id);
  adminStore.documents = adminStore.documents.filter((d) => d.vehicleId !== id);
  adminStore.histories = adminStore.histories.filter((h) => h.vehicleId !== id);
  return ok(null, { message: "Xóa xe thành công" });
}
