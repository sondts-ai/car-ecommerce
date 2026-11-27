"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { validateEmail, validateFullName, validatePhone, type FormErrors } from "@/lib/booking";
import { authApi, getErrorDetails, getErrorMessage } from "@/lib/api";
import { CheckIcon, LockIcon, MailIcon, PhoneIcon, UserIcon } from "@/components/ui/icons";

type RegisterState = {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
};

const INITIAL: RegisterState = {
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  agree: false,
};

export function RegisterForm() {
  const [form, setForm] = useState<RegisterState>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => {
    const value = form.password;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }, [form.password]);

  const strengthLabel = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"][strength];
  const strengthColor = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-emerald-500", "bg-emerald-600"][strength];

  const update = <K extends keyof RegisterState>(key: K, value: RegisterState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const nameError = validateFullName(form.fullName);
    if (nameError) nextErrors.fullName = nameError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    const emailError = validateEmail(form.email, true);
    if (emailError) nextErrors.email = emailError;
    if (form.password.length < 8) nextErrors.password = "Mật khẩu phải có ít nhất 8 ký tự.";
    else if (strength < 2) nextErrors.password = "Mật khẩu quá yếu, hãy thêm chữ hoa hoặc số.";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp.";
    if (!form.agree) nextErrors.agree = "Bạn cần đồng ý với điều khoản để tạo tài khoản.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
    } catch (error) {
      const details = getErrorDetails(error);
      if (Object.keys(details).length > 0) setErrors((prev) => ({ ...prev, ...details }));
      setErrors((prev) => ({
        ...prev,
        form: getErrorMessage(error, "Không thể tạo tài khoản. Vui lòng thử lại."),
      }));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h3 className="mt-4 font-display text-2xl text-ink-950">Tạo tài khoản thành công</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600/75">
          Tài khoản <span className="font-medium text-ink-900">{form.email}</span> đã được tạo. Vui lòng đăng nhập
          để tiếp tục.
        </p>
        <Link href="/login" className="btn-primary mt-6 w-full">
          Đi tới đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {errors.form && (
        <div
          className="rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-[13px] text-red-700"
          role="alert"
        >
          {errors.form}
        </div>
      )}
      <div>
        <label htmlFor="reg-name" className="field-label">
          Họ và tên <span className="text-champagne-600">*</span>
        </label>
        <div className="relative">
          <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
          <input
            id="reg-name"
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            autoComplete="name"
            placeholder="Nguyễn Văn An"
            className={`field pl-11 ${errors.fullName ? "field-error" : ""}`}
            aria-invalid={Boolean(errors.fullName)}
          />
        </div>
        {errors.fullName && <p className="field-error-text" role="alert">{errors.fullName}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-phone" className="field-label">
            Số điện thoại <span className="text-champagne-600">*</span>
          </label>
          <div className="relative">
            <PhoneIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
            <input
              id="reg-phone"
              type="tel"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
              autoComplete="tel"
              placeholder="0901 234 567"
              className={`field pl-11 ${errors.phone ? "field-error" : ""}`}
              aria-invalid={Boolean(errors.phone)}
            />
          </div>
          {errors.phone && <p className="field-error-text" role="alert">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="reg-email" className="field-label">
            Email <span className="text-champagne-600">*</span>
          </label>
          <div className="relative">
            <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
            <input
              id="reg-email"
              type="email"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="email"
              placeholder="ban@email.com"
              className={`field pl-11 ${errors.email ? "field-error" : ""}`}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          {errors.email && <p className="field-error-text" role="alert">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="reg-password" className="field-label">
          Mật khẩu <span className="text-champagne-600">*</span>
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
          <input
            id="reg-password"
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            autoComplete="new-password"
            placeholder="Tối thiểu 8 ký tự"
            className={`field pl-11 ${errors.password ? "field-error" : ""}`}
            aria-invalid={Boolean(errors.password)}
          />
        </div>
        {form.password && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    index < strength ? strengthColor : "bg-cream-200"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-[11px] text-ink-600/60">
              Độ mạnh: <span className="font-medium text-ink-800">{strengthLabel}</span> · Nên có chữ hoa, số
              và ký tự đặc biệt.
            </p>
          </div>
        )}
        {errors.password && <p className="field-error-text" role="alert">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="reg-confirm" className="field-label">
          Xác nhận mật khẩu <span className="text-champagne-600">*</span>
        </label>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
          <input
            id="reg-confirm"
            type="password"
            value={form.confirmPassword}
            onChange={(event) => update("confirmPassword", event.target.value)}
            autoComplete="new-password"
            placeholder="Nhập lại mật khẩu"
            className={`field pl-11 ${errors.confirmPassword ? "field-error" : ""}`}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
        </div>
        {errors.confirmPassword && (
          <p className="field-error-text" role="alert">{errors.confirmPassword}</p>
        )}
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-[12px] leading-relaxed text-ink-700">
          <span
            className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
              form.agree ? "border-ink-950 bg-ink-950 text-cream-50" : "border-cream-300 bg-white"
            } ${errors.agree ? "border-red-400" : ""}`}
          >
            {form.agree && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
          </span>
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(event) => update("agree", event.target.checked)}
            className="sr-only"
          />
          <span>
            Tôi đồng ý với{" "}
            <span className="font-medium text-ink-950 underline underline-offset-2">Điều khoản sử dụng</span>,{" "}
            <span className="font-medium text-ink-950 underline underline-offset-2">Chính sách bảo mật</span>{" "}
            và nhận thông tin ưu đãi từ AutoWeb.
          </span>
        </label>
        {errors.agree && <p className="field-error-text ml-8" role="alert">{errors.agree}</p>}
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
        {loading ? (
          <>
            <Spinner /> Đang tạo tài khoản…
          </>
        ) : (
          "Tạo tài khoản"
        )}
      </button>

      <p className="text-center text-[13px] text-ink-600/70">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-champagne-600 underline-offset-4 hover:underline">
          Đăng nhập
        </Link>
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
