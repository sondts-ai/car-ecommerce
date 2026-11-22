"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LockIcon, MailIcon } from "@/components/ui/icons";
import { authApi, getErrorMessage } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    setLoading(true);
    try {
      await authApi.login({ identifier: identifier.trim(), password });
      router.push("/profile");
      router.refresh();
    } catch (error) {
      setError(getErrorMessage(error, "Đăng nhập không thành công. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {error && (
        <div className="rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="login-id" className="field-label">
          Email
        </label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
          <input
            id="login-id"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            placeholder="ban@email.com"
            className="field pl-11"
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="login-password" className="field-label">
            Mật khẩu
          </label>
          <Link
            href="/forgot-password"
            className="text-[12px] font-medium text-champagne-600 underline-offset-4 hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            className="field pl-11 pr-16"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-[11px] font-medium text-ink-600/60 hover:text-ink-950"
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink-700">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          className="h-4 w-4 rounded border-cream-300 text-ink-950 focus:ring-champagne-400"
        />
        Duy trì đăng nhập trên thiết bị này
      </label>

      <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
        {loading ? (
          <>
            <Spinner /> Đang đăng nhập…
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>

      <div className="relative py-1 text-center">
        <span className="absolute inset-x-0 top-1/2 h-px bg-cream-200" aria-hidden />
        <span className="relative bg-white px-3 text-[11px] uppercase tracking-widest text-ink-600/45">hoặc</span>
      </div>

      <Link href="/register" className="btn-outline w-full">
        Tạo tài khoản mới
      </Link>

      <p className="text-center text-[11px] leading-relaxed text-ink-600/50">
        Bằng việc đăng nhập, bạn đồng ý với{" "}
        <span className="underline underline-offset-2">Điều khoản sử dụng</span> và{" "}
        <span className="underline underline-offset-2">Chính sách bảo mật</span> của AutoWeb.
      </p>
    </form>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
