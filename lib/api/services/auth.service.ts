import { API_CONFIG, ENDPOINTS } from "../config";
import { ApiError, http } from "../http";
import { clearTokens, setTokens } from "../token";
import type {
  AuthSession,
  ChangePasswordPayload,
  ForgotPasswordResult,
  LoginPayload,
  RegisterPayload,
} from "../types";

export type ResetPasswordPayload = {
  email: string;
  otp: string;
  newPassword: string;
};

type BackendAuthView = {
  token: string;
  tokenType: string;
  user: {
    id: number;
    email: string;
    phone: string;
    role: string;
    status: string;
  };
};

type BackendRegistrationView = {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
};

function backendOnlyMessage(): never {
  throw new ApiError({
    code: "INTERNAL_ERROR",
    status: 501,
    message: "Chức năng này chưa được triển khai trong Auth Service.",
  });
}

function mapBackendAuth(data: BackendAuthView): AuthSession {
  return {
    accessToken: data.token,
    refreshToken: "",
    expiresIn: 0,
    user: {
      id: String(data.user.id),
      fullName: data.user.email,
      email: data.user.email,
      phone: data.user.phone,
      tier: "Bạc",
      joinedAt: "",
    },
  };
}

export const authApi = {
  /** POST /auth/login — lưu token vào localStorage khi thành công */
  async login(payload: LoginPayload): Promise<AuthSession> {
    if (API_CONFIG.useBackendServices) {
      const { data } = await http.post<BackendAuthView>(
        "/auth/login",
        { email: payload.identifier, password: payload.password },
        { skipAuth: true, baseUrl: API_CONFIG.services.auth },
      );
      const session = mapBackendAuth(data);
      setTokens({ accessToken: session.accessToken });
      return session;
    }
    const { data } = await http.post<AuthSession>(ENDPOINTS.auth.login, payload, { skipAuth: true });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
  },

  /** POST /auth/register */
  async register(payload: RegisterPayload): Promise<{ userId: string; email: string }> {
    if (API_CONFIG.useBackendServices) {
      const { data } = await http.post<BackendRegistrationView>(
        "/auth/register",
        payload,
        { skipAuth: true, baseUrl: API_CONFIG.services.auth },
      );
      return { userId: String(data.userId), email: data.email };
    }
    const { data } = await http.post<{ userId: string; email: string }>(
      ENDPOINTS.auth.register,
      payload,
      { skipAuth: true },
    );
    return data;
  },

  /** POST /auth/logout — luôn xoá token cục bộ kể cả khi API lỗi */
  async logout(): Promise<void> {
    if (!API_CONFIG.useBackendServices) {
      await http.post<{ ok: true }>(ENDPOINTS.auth.logout);
    }
    clearTokens();
  },

  /** POST /auth/forgot-password */
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    if (!API_CONFIG.useMockApi) backendOnlyMessage();
    const { data } = await http.post<ForgotPasswordResult>(
      ENDPOINTS.auth.forgotPassword,
      { email },
      { skipAuth: true },
    );
    return data;
  },

  /** POST /auth/verify-otp */
  async verifyOtp(email: string, otp: string): Promise<{ verified: boolean; resetToken: string }> {
    if (!API_CONFIG.useMockApi) backendOnlyMessage();
    const { data } = await http.post<{ verified: boolean; resetToken: string }>(
      ENDPOINTS.auth.verifyOtp,
      { email, otp },
      { skipAuth: true },
    );
    return data;
  },

  /** POST /auth/reset-password */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    if (!API_CONFIG.useMockApi) backendOnlyMessage();
    await http.post<{ ok: true }>(ENDPOINTS.auth.resetPassword, payload, { skipAuth: true });
  },

  /** POST /auth/change-password (yêu cầu đăng nhập) */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    if (API_CONFIG.useBackendServices) {
      await http.put(
        "/auth/change-password",
        { ...payload, confirmPassword: payload.newPassword },
        { baseUrl: API_CONFIG.services.auth },
      );
      return;
    }
    await http.post<{ ok: true }>(ENDPOINTS.auth.changePassword, payload);
  },
};
