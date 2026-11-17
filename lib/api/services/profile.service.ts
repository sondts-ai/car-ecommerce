import { ENDPOINTS } from "../config";
import { http } from "../http";
import type { CustomerProfile, UpdateProfilePayload } from "../types";

export const profileApi = {
  /** GET /customers/me — cần đăng nhập */
  async getMe(): Promise<CustomerProfile> {
    const { data } = await http.get<CustomerProfile>(ENDPOINTS.customers.me);
    return data;
  },

  /** PATCH /customers/me */
  async updateMe(payload: UpdateProfilePayload): Promise<CustomerProfile> {
    const { data } = await http.patch<CustomerProfile>(ENDPOINTS.customers.me, payload);
    return data;
  },
};
