"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ApiError,
  authApi,
  clearTokens,
  getErrorMessage,
  hasSession,
  type AuthUser,
} from "@/lib/api";
import { AdminShell } from "./AdminShell";

export function AdminGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "authorized"; user: AuthUser }
    | { status: "forbidden"; user: AuthUser }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    if (isLoginPage) return;

    let cancelled = false;
    async function verify() {
      setState({ status: "loading" });
      if (!hasSession()) {
        router.replace("/admin/login");
        return;
      }
      try {
        const user = await authApi.me();
        if (cancelled) return;
        if (user.role !== "ADMIN") {
          setState({ status: "forbidden", user });
          return;
        }
        setState({ status: "authorized", user });
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          clearTokens();
          router.replace("/admin/login");
          return;
        }
        setState({
          status: "error",
          message: getErrorMessage(err, "Không thể xác minh quyền quản trị."),
        });
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [isLoginPage, retryCount, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-champagne-400 border-t-transparent" />
          <p className="mt-3 text-sm text-ink-600">Đang kiểm tra quyền quản trị...</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
        <div className="card max-w-md p-8 text-center">
          <p className="eyebrow">Không kết nối được dịch vụ xác thực</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">
            Chưa thể mở trang quản trị
          </h1>
          <p className="mt-3 text-sm text-ink-600">{state.message}</p>
          <p className="mt-2 text-xs text-ink-600">
            Phiên đăng nhập được giữ lại. Kiểm tra Auth Service/API Gateway rồi thử lại.
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="btn-primary mt-6 w-full"
          >
            Thử kết nối lại
          </button>
        </div>
      </div>
    );
  }

  if (state.status === "forbidden") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-50 p-6">
        <div className="card max-w-md p-8 text-center">
          <p className="eyebrow">403 — Không có quyền truy cập</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink-950">
            Khu vực dành riêng cho Quản trị viên
          </h1>
          <p className="mt-3 text-sm text-ink-600">
            Tài khoản <strong>{state.user.email}</strong> hiện có vai trò{" "}
            <strong>{state.user.role ?? "CUSTOMER"}</strong> và không được phép truy cập các API
            quản trị.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={async () => {
                await authApi.logout();
                router.replace("/admin/login");
              }}
              className="btn-primary flex-1"
            >
              Đổi tài khoản Admin
            </button>
            <Link href="/" className="btn-outline flex-1">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminShell user={state.user}>{children}</AdminShell>;
}
