import { API_CONFIG } from "./config";

const isBrowser = typeof window !== "undefined";

export function getAccessToken(): string | null {
  if (!isBrowser) return null;
  return window.localStorage.getItem(API_CONFIG.tokenStorageKey);
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  return window.localStorage.getItem(API_CONFIG.refreshTokenStorageKey);
}

export function setTokens(tokens: { accessToken: string; refreshToken?: string }): void {
  if (!isBrowser) return;
  window.localStorage.setItem(API_CONFIG.tokenStorageKey, tokens.accessToken);
  if (tokens.refreshToken) {
    window.localStorage.setItem(API_CONFIG.refreshTokenStorageKey, tokens.refreshToken);
  }
}

export function clearTokens(): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(API_CONFIG.tokenStorageKey);
  window.localStorage.removeItem(API_CONFIG.refreshTokenStorageKey);
}

export function hasSession(): boolean {
  return Boolean(getAccessToken());
}
