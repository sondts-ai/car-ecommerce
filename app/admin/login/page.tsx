"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi, clearTokens, getErrorMessage } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu quản trị.");
      return;
    }

    setLoading(true);
    try {
      const session = await authApi.login({
        identifier: email.trim(),
        password,
      });
      const currentUser = session.user.role ? session.user : await authApi.me();
      if (currentUser.role !== "ADMIN") {
        clearTokens();
        setError(
          "Tài khoản này không có quyền ADMIN. Vui lòng dùng tài khoản quản trị.",
        );
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Đăng nhập thất bại. Vui lòng kiểm tra thông tin.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-champagne-400/20 bg-white p-8 shadow-luxe">
        <div className="text-center">
          <p className="eyebrow">AutoWeb Automotive</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-950">
            Đăng nhập Quản trị
          </h1>
          <p className="mt-2 text-sm text-ink-600">
            Quản lý danh mục hãng xe, dòng xe, tồn kho và chi nhánh showroom.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="field-label">
              Email quản trị
            </label>
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email quản trị"
              className="field"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="field-label">
              Mật khẩu
            </label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="field"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? "Đang xác thực..." : "Vào trang quản trị"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-champagne-600 hover:underline"
          >
            ← Quay lại cổng khách hàng AutoWeb
          </Link>
        </div>
      </div>
    </div>
  );
}
