import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiFailure, ApiSuccess, PaginationMeta } from "@/lib/api/types";
import { findUserByToken, type StoredUser } from "./store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Giả lập độ trễ mạng để UI hiển thị loading/skeleton giống thật. */
export async function latency(min = 140, max = 320): Promise<void> {
  const ms = min + Math.random() * (max - min);
  await new Promise((resolve) => setTimeout(resolve, Math.round(ms)));
}

export function ok<T>(data: T, init?: { status?: number; message?: string; meta?: PaginationMeta }) {
  const body: ApiSuccess<T> = { success: true, data };
  if (init?.message) body.message = init.message;
  if (init?.meta) body.meta = init.meta;
  return NextResponse.json(body, { status: init?.status ?? 200 });
}

export function created<T>(data: T, message?: string) {
  return ok(data, { status: 201, message });
}

export function fail(
  status: number,
  code: ApiErrorCode | string,
  message: string,
  details?: Record<string, string>,
) {
  const body: ApiFailure = { success: false, error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export const unauthorized = (message = "Bạn cần đăng nhập để thực hiện chức năng này.") =>
  fail(401, "UNAUTHORIZED", message);

export const notFound = (message = "Không tìm thấy dữ liệu.") => fail(404, "NOT_FOUND", message);

export const validationError = (details: Record<string, string>, message = "Dữ liệu không hợp lệ.") =>
  fail(422, "VALIDATION_ERROR", message, details);

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function getAuthUser(request: Request): StoredUser | null {
  const token = getBearerToken(request);
  if (!token) return null;
  return findUserByToken(token) ?? null;
}

export async function parseBody<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function requireUser(request: Request): { user: StoredUser } | { response: NextResponse } {
  const user = getAuthUser(request);
  if (!user) return { response: unauthorized() };
  return { user };
}
