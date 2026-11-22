import { API_CONFIG, ENDPOINTS } from "../config";
import { ApiError, http } from "../http";
import { ordersApi } from "./orders.service";
import type {
  CreateDepositPayload,
  CreatePaymentIntentPayload,
  CreateTestDrivePayload,
  DepositDto,
  PaymentDto,
  PaymentMethodId,
  TestDriveDto,
  TestDriveSlotsDto,
} from "../types";

export const depositsApi = {
  /** POST /deposits */
  async create(payload: CreateDepositPayload): Promise<DepositDto> {
    if (API_CONFIG.useBackendServices) {
      const carIdMap: Record<string, number> = {
        "car-s450": 1, "car-x5": 2, "car-911": 3, "car-vf9": 4,
        "car-camry": 1, "car-ranger": 2, "car-q7": 4, "car-vf8": 5,
      };
      const order = await ordersApi.create({
        fullName: payload.customer.fullName,
        vehicleId: payload.vehicleId ?? carIdMap[payload.carSlug] ?? 1,
        vehicleName: payload.carName ?? payload.carSlug,
        vin: payload.vin ?? "PENDING",
        price: payload.totalAmount ?? payload.amount,
        depositAmount: payload.amount,
        note: payload.note,
        reservationMinutes: 15,
      });
      const item = order.items[0];
      return {
        id: String(order.id),
        code: order.orderCode,
        carSlug: payload.carSlug,
        carName: item?.vehicleName ?? payload.carSlug,
        showroomId: payload.showroomId,
        amount: order.depositAmount,
        note: order.note,
        status: "pending_payment",
        customer: payload.customer,
        createdAt: order.createdAt,
        holdUntil: order.reservedUntil ?? new Date(Date.now() + 900_000).toISOString(),
      };
    }
    const { data } = await http.post<DepositDto>(ENDPOINTS.deposits.create, payload);
    return data;
  },

  /** GET /deposits/{id} */
  async get(id: string): Promise<DepositDto> {
    const { data } = await http.get<DepositDto>(ENDPOINTS.deposits.detail(id));
    return data;
  },

  /** GET /deposits — cần đăng nhập */
  async list(): Promise<DepositDto[]> {
    const { data } = await http.get<{ items: DepositDto[] }>(ENDPOINTS.deposits.list);
    return data.items;
  },
};

export const paymentsApi = {
  /** POST /payments/intent */
  async createIntent(payload: CreatePaymentIntentPayload): Promise<PaymentDto> {
    if (payload.orderId !== undefined) {
      if (payload.amount === undefined || payload.amount <= 0) {
        throw new ApiError({
          code: "VALIDATION_ERROR",
          status: 400,
          message: "Cần có số tiền đặt cọc khi tạo payment intent thật.",
        });
      }
      const { data } = await http.post<{
        id: number;
        depositId: string;
        amount: number;
        method: "VNPAY" | "MOMO" | "ZALOPAY" | "BANK_TRANSFER" | "CASH" | "OTHER";
        status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
        transactionId: number;
        transactionCode: string;
        createdAt: string;
      }>(
        "/payments/intent",
        {
          orderId: payload.orderId,
          amount: payload.amount,
          gateway: gatewayFor(payload.method),
        },
        { baseUrl: API_CONFIG.services.payment },
      );
      return mapPayment(data);
    }
    const { data } = await http.post<PaymentDto>(ENDPOINTS.payments.createIntent, payload);
    return data;
  },

  /** POST /payments/{id}/confirm */
  async confirm(paymentId: string): Promise<PaymentDto> {
    if (/^\d+$/.test(paymentId)) {
      const { data } = await http.post<{
        id: number;
        depositId: string;
        amount: number;
        method: "VNPAY" | "MOMO" | "ZALOPAY" | "BANK_TRANSFER" | "CASH" | "OTHER";
        status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
        transactionId: number;
        transactionCode: string;
        createdAt: string;
      }>(`/payments/${paymentId}/confirm`, undefined, { baseUrl: API_CONFIG.services.payment });
      return mapPayment(data);
    }
    const { data } = await http.post<PaymentDto>(ENDPOINTS.payments.confirm(paymentId));
    return data;
  },
};

function gatewayFor(method: PaymentMethodId): "VNPAY" | "BANK_TRANSFER" | "CASH" | "OTHER" {
  if (method === "vnpay") return "VNPAY";
  if (method === "transfer") return "BANK_TRANSFER";
  if (method === "showroom") return "CASH";
  return "OTHER";
}

function mapPayment(payment: {
  id: number;
  depositId: string;
  amount: number;
  method: "VNPAY" | "MOMO" | "ZALOPAY" | "BANK_TRANSFER" | "CASH" | "OTHER";
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
}): PaymentDto {
  const methods: Record<typeof payment.method, PaymentMethodId> = {
    VNPAY: "vnpay",
    MOMO: "transfer",
    ZALOPAY: "transfer",
    BANK_TRANSFER: "transfer",
    CASH: "showroom",
    OTHER: "transfer",
  };
  return {
    id: String(payment.id),
    depositId: payment.depositId,
    amount: payment.amount,
    method: methods[payment.method],
    status: payment.status === "PAID" ? "succeeded" : payment.status === "FAILED" ? "failed" : "pending",
    createdAt: payment.createdAt,
  };
}

export const testDrivesApi = {
  /** POST /test-drives */
  async create(payload: CreateTestDrivePayload): Promise<TestDriveDto> {
    const { data } = await http.post<TestDriveDto>(ENDPOINTS.testDrives.create, payload);
    return data;
  },

  /** GET /test-drives — cần đăng nhập */
  async list(): Promise<TestDriveDto[]> {
    const { data } = await http.get<{ items: TestDriveDto[] }>(ENDPOINTS.testDrives.list);
    return data.items;
  },

  /** GET /test-drives/slots?carSlug=&showroomId=&date= */
  async slots(params: { carSlug: string; showroomId: string; date: string }): Promise<TestDriveSlotsDto> {
    const search = new URLSearchParams(params).toString();
    const { data } = await http.get<TestDriveSlotsDto>(`${ENDPOINTS.testDrives.slots}?${search}`);
    return data;
  },
};
