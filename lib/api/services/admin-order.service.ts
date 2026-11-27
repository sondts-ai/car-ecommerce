import { API_CONFIG } from "../config";
import { http } from "../http";
import type { AdminOrder, AdminOrderStatus, AdminOrderStats } from "../admin-types";

function orderBaseUrl(): string {
  return API_CONFIG.useBackendServices ? API_CONFIG.services.order : API_CONFIG.baseUrl;
}

export const adminOrderApi = {
  async list(): Promise<AdminOrder[]> {
    const baseUrl = orderBaseUrl();
    const { data } = await http.get<AdminOrder[] | { items: AdminOrder[] }>("/admin/orders", {
      baseUrl,
    });
    return Array.isArray(data) ? data : data.items;
  },

  async updateStatus(id: number | string, status: AdminOrderStatus, note: string): Promise<void> {
    await http.put(
      `/admin/orders/${encodeURIComponent(String(id))}/status`,
      { status, note },
      { baseUrl: orderBaseUrl() },
    );
  },

  /** GET /admin/orders/stats — doanh thu, doanh số cho dashboard admin */
  async getStats(): Promise<AdminOrderStats> {
    const { data } = await http.get<AdminOrderStats>("/admin/orders/stats", {
      baseUrl: orderBaseUrl(),
    });
    return data;
  },
};
