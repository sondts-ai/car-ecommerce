import type { BodyType, Car, FuelType } from "@/lib/cars";

/* ------------------------------- Envelope -------------------------------- */

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    /** Lỗi theo từng field, dùng để map vào form */
    details?: Record<string, string>;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "OUT_OF_STOCK"
  | "INVALID_CREDENTIALS"
  | "OTP_INVALID"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

/* --------------------------------- Auth ---------------------------------- */

export type CustomerTier = "Bạc" | "Vàng" | "Kim Cương";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  tier: CustomerTier;
  joinedAt: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: AuthUser;
};

export type LoginPayload = { identifier: string; password: string };

export type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordResult = {
  email: string;
  expiresInMinutes: number;
  /** Chỉ mock API trả về để tiện test — backend thật KHÔNG được trả OTP */
  devOtp?: string;
};

export type ChangePasswordPayload = { currentPassword: string; newPassword: string };

/* -------------------------------- Cars ----------------------------------- */

export type CarListQuery = {
  q?: string;
  brands?: string[];
  bodyTypes?: BodyType[];
  fuels?: FuelType[];
  priceRange?: string | null;
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
  page?: number;
  pageSize?: number;
};

export type CarListResult = {
  items: Car[];
  meta: PaginationMeta;
};

export type AvailabilityStatus = "available" | "unavailable";

export type AvailabilityDto = {
  carSlug: string;
  status: AvailabilityStatus;
  unitsLeft: number;
  checkedAt: string;
  holdMinutes: number;
  note?: string;
};

export type ReviewDto = {
  id: string;
  carSlug: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  createdAt: string;
  verified: boolean;
};

export type CreateReviewPayload = {
  rating: number;
  title?: string;
  content: string;
};

/* ------------------------------- Deposits -------------------------------- */

export type DepositStatus = "pending_payment" | "paid" | "confirmed" | "cancelled" | "completed";
export type PaymentMethodId = "vnpay" | "visa" | "transfer" | "showroom";

export type CreateDepositPayload = {
  carSlug: string;
  vehicleId?: number;
  carName?: string;
  vin?: string;
  showroomId: string;
  amount: number;
  totalAmount?: number;
  note?: string;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
};

export type DepositDto = {
  id: string;
  code: string;
  carSlug: string;
  carName: string;
  showroomId: string;
  amount: number;
  note?: string;
  status: DepositStatus;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  createdAt: string;
  /** Hạn giữ xe (ISO) */
  holdUntil: string;
};

export type PaymentDto = {
  id: string;
  depositId: string;
  amount: number;
  method: PaymentMethodId;
  status: "pending" | "succeeded" | "failed";
  createdAt: string;
  redirectUrl?: string;
  qrPayload?: string;
};

export type CreatePaymentIntentPayload = {
  depositId: string;
  method: PaymentMethodId;
  /** ID thật của order_db.orders; có thì gọi Payment Service, không có thì dùng mock. */
  orderId?: number;
  amount?: number;
};

/* ------------------------------ Test drives ------------------------------ */

export type TestDriveStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type CreateTestDrivePayload = {
  carSlug: string;
  showroomId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note?: string;
  hasLicense: boolean;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
};

export type TestDriveDto = {
  id: string;
  code: string;
  carSlug: string;
  carName: string;
  showroomId: string;
  date: string;
  time: string;
  note?: string;
  status: TestDriveStatus;
  customer: CreateTestDrivePayload["customer"];
  createdAt: string;
};

export type TestDriveSlot = {
  time: string;
  available: boolean;
};

export type TestDriveSlotsDto = {
  carSlug: string;
  showroomId: string;
  date: string;
  slots: TestDriveSlot[];
};

/* ------------------------------- Customer -------------------------------- */

export type CustomerProfile = AuthUser & {
  birthday?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  address?: string;
  city?: string;
  newsletter: boolean;
  updatedAt: string;
};

export type UpdateProfilePayload = Partial<
  Pick<CustomerProfile, "fullName" | "phone" | "birthday" | "address" | "city" | "newsletter">
>;

export type OrderDto = {
  id: number;
  orderCode: string;
  subtotal: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  status:
    | "PENDING_DEPOSIT"
    | "DEPOSIT_PAID"
    | "CONFIRMED"
    | "WAITING_REMAINING_PAYMENT"
    | "COMPLETED"
    | "CANCELLED"
    | "EXPIRED"
    | "REFUNDED";
  reservedUntil?: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    vehicleId: number;
    vehicleName: string;
    vin: string;
    price: number;
  }>;
};
