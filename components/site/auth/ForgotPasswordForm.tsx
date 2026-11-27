"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { validateEmail } from "@/lib/booking";
import { authApi, getErrorMessage } from "@/lib/api";
import { CheckIcon, LockIcon, MailIcon } from "@/components/ui/icons";

type Step = "request" | "verify" | "done";

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    const emailError = validateEmail(email, true);
    if (emailError) {
      setError(emailError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      setDevOtp(result.devOtp ?? null);
      setStep("verify");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Không thể gửi mã xác thực. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError("");
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handlePinKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !pin[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pin.join("").length !== 6) {
      setError("Vui lòng nhập đủ 6 chữ số mã xác thực.");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const otp = pin.join("");
      await authApi.verifyOtp(email.trim(), otp);
      await authApi.resetPassword({ email: email.trim(), otp, newPassword: password });
      setStep("done");
    } catch (resetError) {
      setError(getErrorMessage(resetError, "Không thể đặt lại mật khẩu. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <CheckIcon className="h-7 w-7" strokeWidth={2.5} />
        </span>
        <h2 className="mt-4 font-display text-2xl text-ink-950">Đặt lại mật khẩu thành công</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-600/75">
          Mật khẩu của <span className="font-medium text-ink-900">{email}</span> đã được cập nhật. Bạn có thể
          đăng nhập bằng mật khẩu mới.
        </p>
        <Link href="/login" className="btn-primary mt-6 w-full">
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-6 flex items-center gap-3 text-[11px] font-medium">
        <li className={`flex items-center gap-2 ${step === "request" ? "text-ink-950" : "text-ink-600/50"}`}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
              step === "request"
                ? "border-champagne-500 bg-champagne-50 text-champagne-600"
                : "border-ink-950 bg-ink-950 text-cream-50"
            }`}
          >
            {step === "request" ? "1" : <CheckIcon className="h-3 w-3" strokeWidth={3} />}
          </span>
          Nhập email
        </li>
        <li className="h-px flex-1 bg-cream-300" aria-hidden />
        <li className={`flex items-center gap-2 ${step === "verify" ? "text-ink-950" : "text-ink-600/50"}`}>
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] ${
              step === "verify"
                ? "border-champagne-500 bg-champagne-50 text-champagne-600"
                : "border-cream-300 bg-white"
            }`}
          >
            2
          </span>
          Xác thực & mật khẩu mới
        </li>
      </ol>

      {error && (
        <div className="mb-4 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">
          {error}
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-5" noValidate>
          <div>
            <label htmlFor="forgot-email" className="field-label">
              Email đã đăng ký
            </label>
            <div className="relative">
              <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
                autoComplete="email"
                placeholder="ban@email.com"
                className="field pl-11"
              />
            </div>
            <p className="field-hint">Chúng tôi sẽ gửi mã xác thực 6 chữ số tới email này.</p>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
            {loading ? (
              <>
                <Spinner /> Đang gửi mã…
              </>
            ) : (
              "Gửi mã xác thực"
            )}
          </button>

          <p className="text-center text-[13px] text-ink-600/70">
            Nhớ ra mật khẩu rồi?{" "}
            <Link href="/login" className="font-medium text-champagne-600 underline-offset-4 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-5" noValidate>
          <div className="rounded-xl bg-cream-100 px-4 py-3 text-[12px] leading-relaxed text-ink-700">
            Mã xác thực đã được gửi tới <span className="font-medium text-ink-950">{email}</span>. Mã có hiệu
            lực trong 10 phút.
          </div>

          <div>
            <label className="field-label">Mã xác thực</label>
            <div className="flex gap-2">
              {pin.map((value, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  value={value}
                  onChange={(event) => handlePinChange(index, event.target.value)}
                  onKeyDown={(event) => handlePinKeyDown(index, event)}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Chữ số thứ ${index + 1}`}
                  className="h-12 w-full rounded-xl border border-cream-300 bg-white text-center font-display text-xl text-ink-950 transition focus:border-champagne-400 focus:ring-4 focus:ring-champagne-400/15"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setDevOtp(null);
                setStep("request");
              }}
              className="mt-2 text-[11px] font-medium text-champagne-600 underline-offset-4 hover:underline"
            >
              Chưa nhận được mã? Gửi lại
            </button>
          </div>

          {devOtp && (
            <div className="rounded-xl border border-dashed border-champagne-300 bg-champagne-50 px-4 py-3 text-[12px] leading-relaxed text-ink-700">
              Môi trường thử nghiệm (mock API): mã OTP của bạn là{" "}
              <span className="font-mono text-base font-semibold tracking-[0.3em] text-ink-950">{devOtp}</span>
            </div>
          )}

          <div>
            <label htmlFor="forgot-password" className="field-label">
              Mật khẩu mới
            </label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
              <input
                id="forgot-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
                className="field pl-11"
              />
            </div>
          </div>

          <div>
            <label htmlFor="forgot-confirm" className="field-label">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
              <input
                id="forgot-confirm"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                className="field pl-11"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full gap-2">
            {loading ? (
              <>
                <Spinner /> Đang cập nhật…
              </>
            ) : (
              "Đặt lại mật khẩu"
            )}
          </button>
        </form>
      )}
    </div>
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
