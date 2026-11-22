import { API_CONFIG } from "../config";
import { http } from "../http";
import type { OrderDto } from "../types";
import { profileApi } from "./profile.service";

export type CreateOrderPayload = {
  fullName: string;
  vehicleId: number;
  vehicleName: string;
  vin: string;
  price: number;
  depositAmount: number;
  note?: string;
  reservationMinutes?: number;
};

export const ordersApi = {
  async create(payload: CreateOrderPayload): Promise<OrderDto> {
    if (!API_CONFIG.useBackendServices) throw new Error("Order Service chưa được bật.");
    await profileApi.ensureMe(payload.fullName);
    const { data } = await http.post<OrderDto>("/me/orders", payload, {
      baseUrl: API_CONFIG.services.order,
    });
    return data;
  },
  async list(): Promise<OrderDto[]> {
    if (!API_CONFIG.useBackendServices) return [];
    const { data } = await http.get<OrderDto[]>("/me/orders", {
      baseUrl: API_CONFIG.services.order,
    });
    return data;
  },

  async get(id: number): Promise<OrderDto> {
    if (!API_CONFIG.useBackendServices) {
      throw new Error("Order Service chỉ khả dụng khi bật kết nối backend.");
    }
    const { data } = await http.get<OrderDto>(`/me/orders/${id}`, {
      baseUrl: API_CONFIG.services.order,
    });
    return data;
  },
};
