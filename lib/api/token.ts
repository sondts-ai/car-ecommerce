import { API_CONFIG } from "./config";

const isBrowser = typeof window !== "undefined";

/** Phát sự kiện để header/UI đồng bộ ngay khi đăng nhập/đăng xuất. */
const AUTH_CHANGE_EVENT = "autoweb:auth-change";

function notifyAuthChange(): void {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function onAuthChange(listener: () => void): () => void {
  if (!isBrowser) return () => {};
  window.addEventListener(AUTH_CHANGE_EVENT, listener);
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, listener);
}

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
  notifyAuthChange();
}

export function clearTokens(): void {
  if (!isBrowser) return;
  window.localStorage.removeItem(API_CONFIG.tokenStorageKey);
  window.localStorage.removeItem(API_CONFIG.refreshTokenStorageKey);
  notifyAuthChange();
}

export function hasSession(): boolean {
  return Boolean(getAccessToken());
}
