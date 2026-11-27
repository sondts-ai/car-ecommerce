/* ---------------------- Admin Pagination & Enums ------------------------- */

export type AdminPageResponse<T> = {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
};

export type FuelType = "GASOLINE" | "DIESEL" | "HYBRID" | "ELECTRIC";
export type Transmission = "AUTO" | "MANUAL" | "CVT" | "DCT";
export type VehicleCondition = "NEW" | "USED";
export type VehicleStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "MAINTENANCE";
export type DocumentType = "REGISTRATION" | "INSPECTION" | "INSURANCE" | "INVOICE" | "OTHER";

/* --------------------------- Car Service DTOs ---------------------------- */

export type BrandRequest = {
  name: string;
  logoUrl?: string | null;
  description?: string | null;
};

export type BrandResponse = {
  id: number;
  name: string;
  logoUrl?: string | null;
  description?: string | null;
  createdAt?: string | null;
};

export type CategoryRequest = {
  name: string;
  description?: string | null;
};

export type CategoryResponse = {
  id: number;
  name: string;
  description?: string | null;
  createdAt?: string | null;
};

export type CarModelRequest = {
  brandId: number;
  name: string;
  description?: string | null;
  categoryIds?: number[];
};

export type CarModelSummary = {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
  description?: string | null;
  categories: CategoryResponse[];
  createdAt?: string | null;
};

export type CarVersionRequest = {
  versionName: string;
  engine?: string | null;
  transmission?: Transmission | null;
  fuelType?: FuelType | null;
  seats?: number | null;
};

export type CarVersionResponse = {
  id: number;
  modelId: number;
  versionName: string;
  engine?: string | null;
  transmission?: Transmission | null;
  fuelType?: FuelType | null;
  seats?: number | null;
  createdAt?: string | null;
};

export type CarModelDetail = CarModelSummary & {
  versions: CarVersionResponse[];
};

/* ------------------------ Inventory Service DTOs ------------------------- */

export type BranchRequest = {
  name: string;
  address: string;
  phone?: string | null;
};

export type BranchResponse = {
  id: number;
  name: string;
  address: string;
  phone?: string | null;
  createdAt?: string | null;
};

export type VehicleCreateRequest = {
  versionId: number;
  branchId: number;
  vin: string;
  licensePlate?: string | null;
  condition: VehicleCondition;
  year: number;
  color?: string | null;
  mileage?: number | null;
  price: number;
  description?: string | null;
};

export type VehicleUpdateRequest = Omit<VehicleCreateRequest, "branchId">;

export type VehicleSummary = {
  id: number;
  vin: string;
  licensePlate?: string | null;
  name?: string | null;
  versionId: number;
  branchId?: number | null;
  branchName?: string | null;
  condition: VehicleCondition;
  year: number;
  color?: string | null;
  mileage?: number | null;
  price: number;
  status: VehicleStatus;
  thumbnailUrl?: string | null;
};

export type VehicleImageRequest = {
  imageUrl: string;
  isThumbnail?: boolean;
  sortOrder?: number;
};

export type VehicleImageResponse = {
  id: number;
  vehicleId: number;
  imageUrl: string;
  isThumbnail: boolean;
  sortOrder: number;
};

export type VehicleDocumentRequest = {
  documentType: DocumentType;
  fileUrl: string;
};

export type VehicleDocumentResponse = {
  id: number;
  vehicleId: number;
  documentType: DocumentType;
  fileUrl: string;
  createdAt?: string | null;
};

export type VehicleDetail = {
  id: number;
  vin: string;
  licensePlate?: string | null;
  name?: string | null;
  versionId: number;
  branch?: BranchResponse | null;
  condition: VehicleCondition;
  year: number;
  color?: string | null;
  mileage?: number | null;
  price: number;
  description?: string | null;
  status: VehicleStatus;
  createdAt?: string | null;
  updatedAt?: string | null;
  images: VehicleImageResponse[];
  documents: VehicleDocumentResponse[];
};

export type VehicleStatusChangeRequest = {
  status: VehicleStatus;
  reason?: string | null;
};

export type VehicleBranchChangeRequest = {
  branchId: number;
  reason?: string | null;
};

export type VehicleHistoryResponse = {
  id: number;
  vehicleId: number;
  oldStatus?: VehicleStatus | null;
  newStatus: VehicleStatus;
  reason?: string | null;
  createdAt?: string | null;
};

export type BranchCount = {
  branchId: number;
  branchName: string;
  count: number;
};

export type VehicleStats = {
  total: number;
  byStatus: Record<string, number>;
  byBranch: BranchCount[];
  byCondition: Record<string, number>;
};

/* --------------------------- Order / Revenue ----------------------------- */

export type MonthlyRevenue = {
  /** Dạng YYYY-MM, ví dụ "2026-11" */
  month: string;
  revenue: number;
  orders: number;
};

export type AdminOrderStats = {
  totalOrders: number;
  pendingDeposit: number;
  depositPaid: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  totalDepositRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
};

export type AdminOrderStatus =
  | "PENDING_DEPOSIT"
  | "DEPOSIT_PAID"
  | "CONFIRMED"
  | "WAITING_REMAINING_PAYMENT"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";

export type AdminOrder = {
  id: number | string;
  orderCode: string;
  customerId?: number;
  customer?: { fullName: string; phone: string; email?: string };
  subtotal: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  status: AdminOrderStatus;
  reservedUntil?: string | null;
  note?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: Array<{
    vehicleId: number;
    vehicleName: string;
    vin: string;
    price: number;
  }>;
};

/* ----------------------------- Query Types ------------------------------- */

export type AdminListParams = {
  q?: string;
  page?: number;
  size?: number;
};

export type CarModelListParams = AdminListParams & {
  brandId?: number;
  categoryId?: number;
};

export type VehicleListParams = AdminListParams & {
  status?: VehicleStatus | "";
  branchId?: number;
  versionId?: number;
  condition?: VehicleCondition | "";
  minPrice?: number;
  maxPrice?: number;
};
