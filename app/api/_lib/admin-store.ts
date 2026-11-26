import type {
  AdminPageResponse,
  BranchResponse,
  BrandResponse,
  CarModelDetail,
  CarModelSummary,
  CarVersionResponse,
  CategoryResponse,
  DocumentType,
  FuelType,
  Transmission,
  VehicleCondition,
  VehicleDetail,
  VehicleDocumentResponse,
  VehicleHistoryResponse,
  VehicleImageResponse,
  VehicleStats,
  VehicleStatus,
  VehicleSummary,
} from "@/lib/api/admin-types";
import type { NextResponse } from "next/server";
import { fail, requireUser } from "./response";
import type { StoredUser } from "./store";

type ModelRecord = {
  id: number;
  brandId: number;
  name: string;
  description: string | null;
  categoryIds: number[];
  createdAt: string;
};

type VehicleRecord = {
  id: number;
  versionId: number;
  branchId: number;
  vin: string;
  licensePlate: string | null;
  condition: VehicleCondition;
  year: number;
  color: string | null;
  mileage: number;
  price: number;
  description: string | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
};

type AdminMockStore = {
  brands: BrandResponse[];
  categories: CategoryResponse[];
  models: ModelRecord[];
  versions: CarVersionResponse[];
  branches: BranchResponse[];
  vehicles: VehicleRecord[];
  images: VehicleImageResponse[];
  documents: VehicleDocumentResponse[];
  histories: VehicleHistoryResponse[];
  seq: {
    brand: number;
    category: number;
    model: number;
    version: number;
    branch: number;
    vehicle: number;
    image: number;
    document: number;
    history: number;
  };
};

function nowIso(): string {
  return new Date().toISOString();
}

function createAdminStore(): AdminMockStore {
  const seedTime = "2026-11-01T08:00:00.000Z";
  return {
    brands: [
      { id: 1, name: "Toyota", logoUrl: "https://logo.clearbit.com/toyota.com", description: "Hãng xe Nhật Bản", createdAt: seedTime },
      { id: 2, name: "Honda", logoUrl: "https://logo.clearbit.com/honda.com", description: "Hãng xe Nhật Bản", createdAt: seedTime },
      { id: 3, name: "VinFast", logoUrl: "https://logo.clearbit.com/vinfast.vn", description: "Hãng xe Việt Nam", createdAt: seedTime },
      { id: 4, name: "Mercedes-Benz", logoUrl: "https://logo.clearbit.com/mercedes-benz.com", description: "Hãng xe Đức", createdAt: seedTime },
    ],
    categories: [
      { id: 1, name: "Sedan", description: "Xe sedan 4 cửa", createdAt: seedTime },
      { id: 2, name: "SUV", description: "Xe thể thao đa dụng", createdAt: seedTime },
      { id: 3, name: "Crossover", description: "Xe lai SUV/hatchback", createdAt: seedTime },
      { id: 4, name: "Luxury", description: "Xe hạng sang", createdAt: seedTime },
    ],
    models: [
      { id: 1, brandId: 1, name: "Camry", description: "Sedan hạng D", categoryIds: [1], createdAt: seedTime },
      { id: 2, brandId: 2, name: "CR-V", description: "SUV 5+2 chỗ", categoryIds: [2, 3], createdAt: seedTime },
      { id: 3, brandId: 3, name: "VF 8", description: "SUV điện 5 chỗ", categoryIds: [2], createdAt: seedTime },
      { id: 4, brandId: 4, name: "C 200", description: "Sedan hạng sang", categoryIds: [1, 4], createdAt: seedTime },
    ],
    versions: [
      { id: 1, modelId: 1, versionName: "2.0Q", engine: "2.0L", transmission: "AUTO", fuelType: "GASOLINE", seats: 5, createdAt: seedTime },
      { id: 2, modelId: 1, versionName: "2.5HEV MID", engine: "2.5L Hybrid", transmission: "AUTO", fuelType: "HYBRID", seats: 5, createdAt: seedTime },
      { id: 3, modelId: 1, versionName: "2.5HEV TOP", engine: "2.5L Hybrid", transmission: "AUTO", fuelType: "HYBRID", seats: 5, createdAt: seedTime },
      { id: 4, modelId: 2, versionName: "L AWD", engine: "1.5L Turbo", transmission: "CVT", fuelType: "GASOLINE", seats: 7, createdAt: seedTime },
      { id: 5, modelId: 3, versionName: "Plus", engine: "Electric", transmission: "AUTO", fuelType: "ELECTRIC", seats: 5, createdAt: seedTime },
      { id: 6, modelId: 4, versionName: "C 200 Avantgarde", engine: "1.5L Turbo", transmission: "AUTO", fuelType: "GASOLINE", seats: 5, createdAt: seedTime },
    ],
    branches: [
      { id: 1, name: "Showroom Hà Nội", address: "Số 1 Phạm Hùng, Nam Từ Liêm, Hà Nội", phone: "0241000001", createdAt: seedTime },
      { id: 2, name: "Showroom TP.HCM", address: "Số 2 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh", phone: "0281000002", createdAt: seedTime },
      { id: 3, name: "Showroom Đà Nẵng", address: "Số 3 Nguyễn Tất Thành, Thanh Khê, Đà Nẵng", phone: "0236100003", createdAt: seedTime },
    ],
    vehicles: [
      { id: 1, versionId: 1, branchId: 1, vin: "JTNB11HK0M3000001", licensePlate: "30A-123.45", condition: "NEW", year: 2026, color: "Trắng ngọc trai", mileage: 0, price: 1200000000, description: "Xe mới nguyên chiếc, giao ngay", status: "AVAILABLE", createdAt: seedTime, updatedAt: seedTime },
      { id: 2, versionId: 1, branchId: 1, vin: "JTNB11HK0N3000002", licensePlate: "30A-234.56", condition: "USED", year: 2022, color: "Đen", mileage: 35000, price: 850000000, description: "Xe lướt, bảo dưỡng chính hãng", status: "AVAILABLE", createdAt: seedTime, updatedAt: seedTime },
      { id: 3, versionId: 1, branchId: 2, vin: "JTNB11HK0M3000003", licensePlate: "30A-345.67", condition: "USED", year: 2021, color: "Bạc", mileage: 50000, price: 820000000, description: "Xe gia đình sử dụng, còn đẹp", status: "RESERVED", createdAt: seedTime, updatedAt: seedTime },
      { id: 4, versionId: 4, branchId: 2, vin: "JHLRW2H50SX000004", licensePlate: "30A-456.78", condition: "NEW", year: 2026, color: "Đỏ", mileage: 0, price: 1150000000, description: "Honda CR-V L AWD mới", status: "AVAILABLE", createdAt: seedTime, updatedAt: seedTime },
      { id: 5, versionId: 5, branchId: 3, vin: "RLLV1AEB0NH000005", licensePlate: "30A-567.89", condition: "NEW", year: 2026, color: "Xanh", mileage: 0, price: 999000000, description: "VinFast VF 8 Plus mới", status: "SOLD", createdAt: seedTime, updatedAt: seedTime },
    ],
    images: [
      { id: 1, vehicleId: 1, imageUrl: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=1200", isThumbnail: true, sortOrder: 1 },
      { id: 2, vehicleId: 1, imageUrl: "https://images.unsplash.com/photo-1550355291-bbee04a92027?w=1200", isThumbnail: false, sortOrder: 2 },
      { id: 3, vehicleId: 2, imageUrl: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200", isThumbnail: true, sortOrder: 1 },
      { id: 4, vehicleId: 3, imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200", isThumbnail: true, sortOrder: 1 },
      { id: 5, vehicleId: 4, imageUrl: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=1200", isThumbnail: true, sortOrder: 1 },
      { id: 6, vehicleId: 5, imageUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200", isThumbnail: true, sortOrder: 1 },
    ],
    documents: [
      { id: 1, vehicleId: 1, documentType: "REGISTRATION", fileUrl: "/docs/vehicles/1/registration.pdf", createdAt: seedTime },
      { id: 2, vehicleId: 1, documentType: "INSPECTION", fileUrl: "/docs/vehicles/1/inspection.pdf", createdAt: seedTime },
      { id: 3, vehicleId: 2, documentType: "REGISTRATION", fileUrl: "/docs/vehicles/2/registration.pdf", createdAt: seedTime },
    ],
    histories: [
      { id: 1, vehicleId: 1, oldStatus: null, newStatus: "AVAILABLE", reason: "Nhập xe mới về showroom", createdAt: seedTime },
      { id: 2, vehicleId: 2, oldStatus: null, newStatus: "AVAILABLE", reason: "Nhập xe lướt về showroom", createdAt: seedTime },
      { id: 3, vehicleId: 3, oldStatus: "AVAILABLE", newStatus: "RESERVED", reason: "Khách đặt cọc giữ xe", createdAt: seedTime },
      { id: 4, vehicleId: 4, oldStatus: null, newStatus: "AVAILABLE", reason: "Nhập xe mới về showroom", createdAt: seedTime },
      { id: 5, vehicleId: 5, oldStatus: "AVAILABLE", newStatus: "SOLD", reason: "Hoàn tất bàn giao xe", createdAt: seedTime },
    ],
    seq: {
      brand: 5,
      category: 5,
      model: 5,
      version: 7,
      branch: 4,
      vehicle: 6,
      image: 7,
      document: 4,
      history: 6,
    },
  };
}

const g = globalThis as unknown as { __autowebAdminMockStore?: AdminMockStore };
export const adminStore: AdminMockStore = g.__autowebAdminMockStore ?? createAdminStore();
if (process.env.NODE_ENV !== "production") {
  g.__autowebAdminMockStore = adminStore;
}

export function requireAdmin(request: Request): { user: StoredUser } | { response: NextResponse } {
  const auth = requireUser(request);
  if ("response" in auth) return auth;
  if (auth.user.role !== "ADMIN") {
    return { response: fail(403, "FORBIDDEN", "Chỉ tài khoản ADMIN mới được phép truy cập.") };
  }
  return auth;
}

export function paginate<T>(items: T[], pageParam: string | null, sizeParam: string | null): AdminPageResponse<T> {
  const page = Math.max(0, Number.parseInt(pageParam ?? "0", 10) || 0);
  const rawSize = Number.parseInt(sizeParam ?? "20", 10) || 20;
  const size = Math.min(100, Math.max(1, rawSize));
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / size);
  const start = page * size;
  return {
    items: items.slice(start, start + size),
    page,
    size,
    totalItems,
    totalPages,
  };
}

export function toModelSummary(m: ModelRecord): CarModelSummary {
  const brand = adminStore.brands.find((b) => b.id === m.brandId);
  const categories = m.categoryIds
    .map((cid) => adminStore.categories.find((c) => c.id === cid))
    .filter((c): c is CategoryResponse => Boolean(c));
  return {
    id: m.id,
    brandId: m.brandId,
    brandName: brand?.name ?? "Không rõ",
    name: m.name,
    description: m.description,
    categories,
    createdAt: m.createdAt,
  };
}

export function toModelDetail(m: ModelRecord): CarModelDetail {
  return {
    ...toModelSummary(m),
    versions: adminStore.versions.filter((v) => v.modelId === m.id),
  };
}

export function getFullVehicleName(versionId: number): string | null {
  const version = adminStore.versions.find((v) => v.id === versionId);
  if (!version) return null;
  const model = adminStore.models.find((m) => m.id === version.modelId);
  if (!model) return version.versionName;
  const brand = adminStore.brands.find((b) => b.id === model.brandId);
  return [brand?.name, model.name, version.versionName].filter(Boolean).join(" ");
}

export function toVehicleSummary(v: VehicleRecord): VehicleSummary {
  const branch = adminStore.branches.find((b) => b.id === v.branchId);
  const imgs = adminStore.images
    .filter((i) => i.vehicleId === v.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const thumb = imgs.find((i) => i.isThumbnail) ?? imgs[0];
  return {
    id: v.id,
    vin: v.vin,
    licensePlate: v.licensePlate,
    name: getFullVehicleName(v.versionId),
    versionId: v.versionId,
    branchId: branch?.id ?? null,
    branchName: branch?.name ?? null,
    condition: v.condition,
    year: v.year,
    color: v.color,
    mileage: v.mileage,
    price: v.price,
    status: v.status,
    thumbnailUrl: thumb?.imageUrl ?? null,
  };
}

export function toVehicleDetail(v: VehicleRecord): VehicleDetail {
  const branch = adminStore.branches.find((b) => b.id === v.branchId) ?? null;
  const images = adminStore.images
    .filter((i) => i.vehicleId === v.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
  const documents = adminStore.documents
    .filter((d) => d.vehicleId === v.id)
    .sort((a, b) => b.id - a.id);
  return {
    id: v.id,
    vin: v.vin,
    licensePlate: v.licensePlate,
    name: getFullVehicleName(v.versionId),
    versionId: v.versionId,
    branch,
    condition: v.condition,
    year: v.year,
    color: v.color,
    mileage: v.mileage,
    price: v.price,
    description: v.description,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
    images,
    documents,
  };
}

export function computeVehicleStats(): VehicleStats {
  const byStatus: Record<string, number> = {
    AVAILABLE: 0,
    RESERVED: 0,
    SOLD: 0,
    MAINTENANCE: 0,
  };
  const byCondition: Record<string, number> = {
    NEW: 0,
    USED: 0,
  };
  const branchMap = new Map<number, number>();
  for (const b of adminStore.branches) branchMap.set(b.id, 0);

  for (const v of adminStore.vehicles) {
    byStatus[v.status] = (byStatus[v.status] ?? 0) + 1;
    byCondition[v.condition] = (byCondition[v.condition] ?? 0) + 1;
    branchMap.set(v.branchId, (branchMap.get(v.branchId) ?? 0) + 1);
  }

  const byBranch = adminStore.branches.map((b) => ({
    branchId: b.id,
    branchName: b.name,
    count: branchMap.get(b.id) ?? 0,
  }));

  return {
    total: adminStore.vehicles.length,
    byStatus,
    byBranch,
    byCondition,
  };
}

export const VALID_FUELS: FuelType[] = ["GASOLINE", "DIESEL", "HYBRID", "ELECTRIC"];
export const VALID_TRANSMISSIONS: Transmission[] = ["AUTO", "MANUAL", "CVT", "DCT"];
export const VALID_CONDITIONS: VehicleCondition[] = ["NEW", "USED"];
export const VALID_STATUSES: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD", "MAINTENANCE"];
export const VALID_DOC_TYPES: DocumentType[] = ["REGISTRATION", "INSPECTION", "INSURANCE", "INVOICE", "OTHER"];
export { nowIso };
