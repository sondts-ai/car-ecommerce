/**
 * Cấu hình kết nối API.
 *
 * - NEXT_PUBLIC_API_BASE_URL: đổi sang backend thật, ví dụ https://api.autoweb.vn/v1
 * - NEXT_PUBLIC_API_TIMEOUT: timeout mỗi request (ms)
 * - NEXT_PUBLIC_USE_MOCK_API: "true" để dùng mock backend trong app/api (mặc định)
 */
export const API_CONFIG = {
  baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || "/api").replace(/\/+$/, ""),
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT || 15_000),
  useMockApi: (process.env.NEXT_PUBLIC_USE_MOCK_API ?? "true") !== "false",
  tokenStorageKey: "autoweb.access_token",
  refreshTokenStorageKey: "autoweb.refresh_token",
} as const;

/** Endpoint path (tương đối so với baseUrl) */
export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    verifyOtp: "/auth/verify-otp",
    resetPassword: "/auth/reset-password",
    changePassword: "/auth/change-password",
  },
  customers: {
    me: "/customers/me",
  },
  cars: {
    list: "/cars",
    detail: (slug: string) => `/cars/${encodeURIComponent(slug)}`,
    availability: (slug: string) => `/cars/${encodeURIComponent(slug)}/availability`,
    reviews: (slug: string) => `/cars/${encodeURIComponent(slug)}/reviews`,
  },
  deposits: {
    list: "/deposits",
    create: "/deposits",
    detail: (id: string) => `/deposits/${encodeURIComponent(id)}`,
  },
  payments: {
    createIntent: "/payments/intent",
    confirm: (id: string) => `/payments/${encodeURIComponent(id)}/confirm`,
  },
  testDrives: {
    list: "/test-drives",
    create: "/test-drives",
    slots: "/test-drives/slots",
  },
  health: "/health",
} as const;
