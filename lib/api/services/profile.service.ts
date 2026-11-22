import { API_CONFIG, ENDPOINTS } from "../config";
import { ApiError, http } from "../http";
import type { CustomerProfile, UpdateProfilePayload } from "../types";

type BackendProfileView = {
  customerId: number;
  userId: number;
  fullName: string;
  birthday?: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  createdAt: string;
  updatedAt: string;
  account?: {
    userId: number;
    email: string;
    phone: string;
    role: string;
    status: string;
  };
};

function mapProfile(data: BackendProfileView): CustomerProfile {
  return {
    id: String(data.userId),
    fullName: data.fullName,
    email: data.account?.email ?? "",
    phone: data.account?.phone ?? "",
    tier: "Bạc",
    joinedAt: data.createdAt,
    birthday: data.birthday,
    gender: data.gender,
    newsletter: false,
    updatedAt: data.updatedAt,
  };
}

export const profileApi = {
  async ensureMe(fullName: string): Promise<void> {
    if (!API_CONFIG.useBackendServices) return;
    try {
      await this.getMe();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) {
        throw error;
      }
      await http.post(
        "/customers/me",
        { fullName, birthday: null, gender: "OTHER" },
        { baseUrl: API_CONFIG.services.customer },
      );
    }
  },
  /** GET /customers/me — cần đăng nhập */
  async getMe(): Promise<CustomerProfile> {
    if (API_CONFIG.useBackendServices) {
      const { data } = await http.get<BackendProfileView>("/customers/me", {
        baseUrl: API_CONFIG.services.customer,
      });
      return mapProfile(data);
    }
    const { data } = await http.get<CustomerProfile>(ENDPOINTS.customers.me);
    return data;
  },

  /** PATCH /customers/me */
  async updateMe(payload: UpdateProfilePayload): Promise<CustomerProfile> {
    if (API_CONFIG.useBackendServices) {
      await http.put<BackendProfileView>(
        "/customers/me",
        {
          fullName: payload.fullName,
          birthday: payload.birthday || null,
          gender: "OTHER",
        },
        { baseUrl: API_CONFIG.services.customer },
      );
      const { data } = await http.get<BackendProfileView>("/customers/me", {
        baseUrl: API_CONFIG.services.customer,
      });
      return mapProfile(data);
    }
    const { data } = await http.patch<CustomerProfile>(ENDPOINTS.customers.me, payload);
    return data;
  },
};
