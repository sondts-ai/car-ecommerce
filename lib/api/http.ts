import { API_CONFIG } from "./config";
import { getAccessToken } from "./token";
import type { ApiFailure, ApiResponse, ApiErrorCode, PaginationMeta } from "./types";

export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly status: number;
  readonly details?: Record<string, string>;

  constructor(params: {
    message: string;
    code?: ApiErrorCode | string;
    status?: number;
    details?: Record<string, string>;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.code = params.code ?? "INTERNAL_ERROR";
    this.status = params.status ?? 0;
    this.details = params.details;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** Không gắn Authorization header (dùng cho login/register) */
  skipAuth?: boolean;
  /** Ghi đè timeout (ms) */
  timeout?: number;
  signal?: AbortSignal;
  cache?: RequestCache;
  baseUrl?: string;
};

export type ApiResult<T> = {
  data: T;
  meta?: PaginationMeta;
  message?: string;
};

export function buildQuery(params: Record<string, string | number | boolean | string[] | null | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) {
      if (value.length > 0) search.set(key, value.join(","));
      return;
    }
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function resolveUrl(path: string, baseUrl = API_CONFIG.baseUrl): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = baseUrl;
  if (/^https?:\/\//i.test(base)) {
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }
  if (typeof window !== "undefined") {
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
  }
  // Server-side: cần URL tuyệt đối
  return `http://localhost:3000${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Gọi API và bóc tách envelope `{ success, data, meta, message }`.
 * Tự gắn Bearer token, timeout, và chuẩn hoá lỗi thành `ApiError`.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, headers = {}, skipAuth, timeout, signal, cache, baseUrl } = options;
  const controller = new AbortController();
  const timeoutMs = timeout ?? API_CONFIG.timeout;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  const token = skipAuth ? null : getAccessToken();

  let response: Response;
  try {
    response = await fetch(resolveUrl(path, baseUrl), {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      cache: cache ?? "no-store",
    });
  } catch (error) {
    clearTimeout(timer);
    const aborted = error instanceof DOMException && error.name === "AbortError";
    throw new ApiError({
      code: aborted ? "NETWORK_ERROR" : "NETWORK_ERROR",
      status: 0,
      message: aborted
        ? "Yêu cầu quá thời gian chờ. Vui lòng thử lại."
        : "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng.",
    });
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload: ApiResponse<T> | null = contentType.includes("application/json")
    ? ((await response.json().catch(() => null)) as ApiResponse<T> | null)
    : null;

  if (!response.ok || !payload || payload.success === false) {
    const failure = payload && payload.success === false ? (payload as ApiFailure) : null;
    const backendMessage =
      payload && typeof (payload as { message?: unknown }).message === "string"
        ? (payload as { message: string }).message
        : undefined;
    throw new ApiError({
      status: response.status,
      code: failure?.error?.code ?? (response.status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR"),
      message:
        failure?.error?.message ??
        backendMessage ??
        `Máy chủ trả về lỗi ${response.status}. Vui lòng thử lại sau.`,
      details: failure?.error?.details,
    });
  }

  return { data: payload.data, meta: payload.meta, message: payload.message };
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...options, method: "DELETE" }),
};

/** Chuẩn hoá lỗi bất kỳ thành message hiển thị được cho người dùng. */
export function getErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra. Vui lòng thử lại."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/** Map lỗi validate của backend vào state lỗi form. */
export function getErrorDetails(error: unknown): Record<string, string> {
  if (error instanceof ApiError && error.details) return error.details;
  return {};
}
