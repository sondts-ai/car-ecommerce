import { ENDPOINTS } from "../config";
import { http } from "../http";
import type {
  CreateDepositPayload,
  CreatePaymentIntentPayload,
  CreateTestDrivePayload,
  DepositDto,
  PaymentDto,
  TestDriveDto,
  TestDriveSlotsDto,
} from "../types";

export const depositsApi = {
  /** POST /deposits */
  async create(payload: CreateDepositPayload): Promise<DepositDto> {
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
    const { data } = await http.post<PaymentDto>(ENDPOINTS.payments.createIntent, payload);
    return data;
  },

  /** POST /payments/{id}/confirm */
  async confirm(paymentId: string): Promise<PaymentDto> {
    const { data } = await http.post<PaymentDto>(ENDPOINTS.payments.confirm(paymentId));
    return data;
  },
};

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
