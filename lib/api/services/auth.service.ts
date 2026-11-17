import { ENDPOINTS } from "../config";
import { http } from "../http";
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

export const authApi = {
  /** POST /auth/login — lưu token vào localStorage khi thành công */
  async login(payload: LoginPayload): Promise<AuthSession> {
    const { data } = await http.post<AuthSession>(ENDPOINTS.auth.login, payload, { skipAuth: true });
    setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
    return data;
  },

  /** POST /auth/register */
  async register(payload: RegisterPayload): Promise<{ userId: string; email: string }> {
    const { data } = await http.post<{ userId: string; email: string }>(
      ENDPOINTS.auth.register,
      payload,
      { skipAuth: true },
    );
    return data;
  },

  /** POST /auth/logout — luôn xoá token cục bộ kể cả khi API lỗi */
  async logout(): Promise<void> {
    try {
      await http.post<{ ok: true }>(ENDPOINTS.auth.logout);
    } finally {
      clearTokens();
    }
  },

  /** POST /auth/forgot-password */
  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const { data } = await http.post<ForgotPasswordResult>(
      ENDPOINTS.auth.forgotPassword,
      { email },
      { skipAuth: true },
    );
    return data;
  },

  /** POST /auth/verify-otp */
  async verifyOtp(email: string, otp: string): Promise<{ verified: boolean; resetToken: string }> {
    const { data } = await http.post<{ verified: boolean; resetToken: string }>(
      ENDPOINTS.auth.verifyOtp,
      { email, otp },
      { skipAuth: true },
    );
    return data;
  },

  /** POST /auth/reset-password */
  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await http.post<{ ok: true }>(ENDPOINTS.auth.resetPassword, payload, { skipAuth: true });
  },

  /** POST /auth/change-password (yêu cầu đăng nhập) */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await http.post<{ ok: true }>(ENDPOINTS.auth.changePassword, payload);
  },
};
