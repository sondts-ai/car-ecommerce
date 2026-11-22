"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Car } from "@/lib/cars";
import { formatVnd } from "@/lib/cars";
import {
  DEPOSIT_OPTIONS,
  PAYMENT_METHODS,
  SHOWROOMS,
  formatDisplayDate,
  toIsoDate,
  type FormErrors,
  type PaymentMethodId,
  validateEmail,
  validateFullName,
  validatePhone,
} from "@/lib/booking";
import { carsApi, depositsApi, getErrorDetails, getErrorMessage, paymentsApi } from "@/lib/api";
import type { AvailabilityDto, DepositDto } from "@/lib/api/types";
import { CarVisual } from "@/components/cars/CarVisual";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  LockIcon,
  MapPinIcon,
  ShieldIcon,
  SlidersIcon,
  XIcon,
} from "@/components/ui/icons";

type DepositFormProps = {
  car: Car;
};

type Step = 1 | 2 | 3;

type DepositFormState = {
  fullName: string;
  phone: string;
  email: string;
  showroomId: string;
  depositPreset: "20" | "50" | "100" | "custom";
  customDeposit: string;
  note: string;
  agree: boolean;
  paymentMethod: PaymentMethodId;
};

const INITIAL_FORM: DepositFormState = {
  fullName: "",
  phone: "",
  email: "",
  showroomId: SHOWROOMS[0].id,
  depositPreset: "20",
  customDeposit: "",
  note: "",
  agree: false,
  paymentMethod: "vnpay",
};

const STEPS = [
  { id: 1, label: "Xác nhận xe & đặt cọc" },
  { id: 2, label: "Thanh toán" },
  { id: 3, label: "Hoàn tất" },
] as const;

export function DepositForm({ car }: DepositFormProps) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<DepositFormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [availability, setAvailability] = useState<AvailabilityDto | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingDeposit, setCreatingDeposit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deposit, setDeposit] = useState<DepositDto | null>(null);
  const [holdSeconds, setHoldSeconds] = useState(0);

  const showroom = SHOWROOMS.find((item) => item.id === form.showroomId) ?? SHOWROOMS[0];

  const depositAmount = useMemo(() => {
    if (form.depositPreset === "custom") return Number(form.customDeposit.replace(/\D/g, "")) || 0;
    return Number(form.depositPreset) * 1_000_000;
  }, [form.depositPreset, form.customDeposit]);

  const remaining = Math.max(car.price - depositAmount, 0);
  const isAvailable = availability?.status === "available";

  /* UC: Kiểm tra tình trạng xe — gọi API thật khi mở form */
  const runAvailabilityCheck = async () => {
    setChecking(true);
    setAvailability(null);
    setAvailabilityError(null);
    try {
      const result = await carsApi.checkAvailability(car.slug);
      setAvailability(result);
    } catch (error) {
      setAvailability(null);
      setAvailabilityError(
        getErrorMessage(error, "Không thể kiểm tra tình trạng xe. Vui lòng thử lại."),
      );
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setAvailabilityError(null);
    carsApi
      .checkAvailability(car.slug)
      .then((result) => {
        if (cancelled) return;
        setAvailability(result);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setAvailabilityError(
          getErrorMessage(error, "Không thể kiểm tra tình trạng xe. Vui lòng thử lại."),
        );
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [car.slug]);

  /* Đếm ngược thời gian giữ xe sau khi kiểm tra thành công */
  useEffect(() => {
    if (!isAvailable || !availability) return;
    setHoldSeconds(availability.holdMinutes * 60);
    const timer = setInterval(() => {
      setHoldSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isAvailable, availability]);

  const holdLabel = `${String(Math.floor(holdSeconds / 60)).padStart(2, "0")}:${String(
    holdSeconds % 60,
  ).padStart(2, "0")}`;

  const update = <K extends keyof DepositFormState>(key: K, value: DepositFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key as string]) return prev;
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const validateStepOne = (): boolean => {
    const nextErrors: FormErrors = {};
    const nameError = validateFullName(form.fullName);
    if (nameError) nextErrors.fullName = nameError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    const emailError = validateEmail(form.email);
    if (emailError) nextErrors.email = emailError;
    if (depositAmount < 10_000_000) nextErrors.deposit = "Số tiền đặt cọc tối thiểu là 10.000.000 ₫.";
    else if (depositAmount > car.price * 0.3)
      nextErrors.deposit = "Số tiền đặt cọc không vượt quá 30% giá trị xe.";
    if (!form.agree) nextErrors.agree = "Vui lòng đồng ý với điều khoản đặt cọc.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const goToPayment = async () => {
    if (!isAvailable || checking || creatingDeposit) return;
    if (!validateStepOne()) return;
    setSubmitError(null);
    setCreatingDeposit(true);
    try {
      /* UC: Tạo đơn đặt cọc — backend kiểm tra tồn kho và giữ xe */
      const created = await depositsApi.create({
        carSlug: car.slug,
        carName: car.name,
        vin: "PENDING",
        showroomId: form.showroomId,
        amount: depositAmount,
        totalAmount: car.price,
        note: form.note.trim() || undefined,
        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone,
          email: form.email.trim() || undefined,
        },
      });
      setDeposit(created);
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const details = getErrorDetails(error);
      if (details.amount) details.deposit = details.amount;
      if (Object.keys(details).length > 0) setErrors((prev) => ({ ...prev, ...details }));
      setSubmitError(getErrorMessage(error, "Không thể tạo đơn đặt cọc. Vui lòng thử lại."));
    } finally {
      setCreatingDeposit(false);
    }
  };

  const confirmPayment = async () => {
    if (!deposit || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      /* UC: Thanh toán — tạo payment intent rồi xác nhận với cổng thanh toán */
      const intent = await paymentsApi.createIntent({
        depositId: deposit.id,
        method: form.paymentMethod,
        orderId: Number(deposit.id),
        amount: deposit.amount,
      });
      await paymentsApi.confirm(intent.id);
      setStep(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Thanh toán không thành công. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-luxe py-10 lg:py-14">
      <Stepper current={step} />

      {step === 1 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
          <div className="space-y-6">
            <AvailabilityBanner
              checking={checking}
              availability={availability}
              error={availabilityError}
              holdLabel={holdLabel}
              onRetry={runAvailabilityCheck}
            />

            <section className="card p-6 sm:p-8">
              <header className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">Bước 1 / 3</p>
                  <h1 className="mt-2 font-display text-[26px] leading-tight text-ink-950 sm:text-3xl">
                    Thông tin đặt cọc
                  </h1>
                  <p className="mt-2 text-sm text-ink-600/75">
                    Mọi thông tin được bảo mật và chỉ dùng để xử lý đơn đặt cọc của bạn.
                  </p>
                </div>
                <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream-100 text-champagne-600 sm:flex">
                  <ShieldIcon className="h-5 w-5" />
                </span>
              </header>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Họ và tên"
                  required
                  error={errors.fullName}
                  id="deposit-fullname"
                  placeholder="Nguyễn Văn An"
                  value={form.fullName}
                  onChange={(value) => update("fullName", value)}
                  autoComplete="name"
                />
                <Field
                  label="Số điện thoại"
                  required
                  error={errors.phone}
                  id="deposit-phone"
                  placeholder="0901 234 567"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(value) => update("phone", value)}
                  autoComplete="tel"
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Email"
                    id="deposit-email"
                    placeholder="ban@email.com"
                    error={errors.email}
                    helper="Nhận hợp đồng đặt cọc và hoá đơn qua email."
                    value={form.email}
                    onChange={(value) => update("email", value)}
                    autoComplete="email"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="deposit-showroom" className="field-label">
                    Showroom tiếp nhận <span className="text-champagne-600">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="deposit-showroom"
                      value={form.showroomId}
                      onChange={(event) => update("showroomId", event.target.value)}
                      className="field appearance-none pr-10"
                    >
                      {SHOWROOMS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} — {item.city}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
                  </div>
                  <p className="field-hint inline-flex items-center gap-1.5">
                    <MapPinIcon className="h-3.5 w-3.5" /> {showroom.address} · Hotline {showroom.hotline}
                  </p>
                </div>
              </div>

              {/* Chọn mức đặt cọc */}
              <div className="mt-7">
                <div className="flex items-baseline justify-between">
                  <p className="field-label mb-0">
                    Số tiền đặt cọc <span className="text-champagne-600">*</span>
                  </p>
                  <p className="text-xs text-ink-600/60">Tối thiểu 10 triệu · Tối đa 30% giá xe</p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {DEPOSIT_OPTIONS.map((option) => {
                    const preset = String(option.value / 1_000_000) as "20" | "50" | "100";
                    const active = form.depositPreset === preset;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => update("depositPreset", preset)}
                        aria-pressed={active}
                        className={`rounded-xl border p-4 text-left transition ${
                          active
                            ? "border-champagne-400 bg-champagne-50 ring-4 ring-champagne-400/15"
                            : "border-cream-300 bg-white hover:border-champagne-300"
                        }`}
                      >
                        <span className="flex items-center justify-between">
                          <span className="font-display text-lg text-ink-950">{option.label}</span>
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                              active ? "border-champagne-500 bg-champagne-500 text-white" : "border-cream-300"
                            }`}
                          >
                            {active && <CheckIcon className="h-2.5 w-2.5" strokeWidth={3} />}
                          </span>
                        </span>
                        <span className="mt-1 block text-[11px] leading-relaxed text-ink-600/70">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => update("depositPreset", "custom")}
                  aria-pressed={form.depositPreset === "custom"}
                  className={`mt-3 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                    form.depositPreset === "custom"
                      ? "border-champagne-400 bg-champagne-50"
                      : "border-cream-300 bg-white hover:border-champagne-300"
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-medium text-ink-800">
                    <SlidersIcon className="h-4 w-4 text-champagne-600" />
                    Số tiền khác
                  </span>
                  {form.depositPreset === "custom" ? (
                    <span className="font-display text-base text-ink-950">{formatVnd(depositAmount)}</span>
                  ) : (
                    <span className="text-xs text-ink-600/55">Tự nhập</span>
                  )}
                </button>

                {form.depositPreset === "custom" && (
                  <div className="mt-3">
                    <div className="relative">
                      <input
                        id="deposit-custom"
                        type="text"
                        inputMode="numeric"
                        value={form.customDeposit}
                        onChange={(event) =>
                          update("customDeposit", event.target.value.replace(/\D/g, "").slice(0, 12))
                        }
                        placeholder="20.000.000"
                        className={`field pr-12 ${errors.deposit ? "field-error" : ""}`}
                        aria-label="Số tiền đặt cọc tự nhập"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-ink-600/55">₫</span>
                    </div>
                    <p className="field-hint">
                      {depositAmount > 0
                        ? `Bằng chữ: ${formatVnd(depositAmount)}`
                        : "Nhập số tiền bạn muốn đặt cọc."}
                    </p>
                  </div>
                )}
                {errors.deposit && <p className="field-error-text">{errors.deposit}</p>}
              </div>

              <div className="mt-7">
                <label htmlFor="deposit-note" className="field-label">
                  Ghi chú cho showroom
                </label>
                <textarea
                  id="deposit-note"
                  rows={3}
                  value={form.note}
                  onChange={(event) => update("note", event.target.value)}
                  placeholder="Ví dụ: Muốn nhận xe màu đen, cần xuất hoá đơn công ty…"
                  className="field resize-none"
                />
              </div>

              <label className="mt-6 flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-700">
                <span
                  className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
                    form.agree ? "border-ink-950 bg-ink-950 text-cream-50" : "border-cream-300 bg-white"
                  }`}
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
                  Tôi đã đọc và đồng ý với{" "}
                  <span className="font-medium text-ink-950 underline underline-offset-2">
                    điều khoản đặt cọc
                  </span>{" "}
                  và{" "}
                  <span className="font-medium text-ink-950 underline underline-offset-2">
                    chính sách bảo mật
                  </span>{" "}
                  của AutoWeb.
                </span>
              </label>
              {errors.agree && <p className="field-error-text">{errors.agree}</p>}

              {submitError && step === 1 && <ErrorBanner message={submitError} />}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link href={`/cars/${car.slug}`} className="text-sm text-ink-600/70 hover:text-ink-950">
                  ← Quay lại chi tiết xe
                </Link>
                <button
                  type="button"
                  onClick={goToPayment}
                  disabled={!isAvailable || checking || creatingDeposit}
                  className="btn-primary w-full gap-2 px-8 sm:w-auto"
                >
                  {creatingDeposit ? (
                    <>
                      <Spinner /> Đang giữ xe…
                    </>
                  ) : (
                    <>
                      Tiếp tục thanh toán
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
              {!isAvailable && !checking && !availabilityError && (
                <p className="mt-3 text-right text-xs text-amber-700">
                  Cần xác nhận xe còn hàng trước khi tiếp tục.
                </p>
              )}
            </section>
          </div>

          <OrderSummary
            car={car}
            depositAmount={depositAmount}
            remaining={remaining}
            showroomName={`${showroom.name} — ${showroom.city}`}
            holdLabel={isAvailable ? holdLabel : null}
          />
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
          <section className="card p-6 sm:p-8">
            <header className="mb-6">
              <p className="eyebrow">Bước 2 / 3</p>
              <h1 className="mt-2 font-display text-[26px] leading-tight text-ink-950 sm:text-3xl">
                Chọn phương thức thanh toán
              </h1>
              <p className="mt-2 text-sm text-ink-600/75">
                Giao dịch được mã hoá theo tiêu chuẩn PCI DSS. AutoWeb không lưu trữ thông tin thẻ của bạn.
              </p>
            </header>

            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => {
                const active = form.paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => update("paymentMethod", method.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-champagne-400 bg-champagne-50 ring-4 ring-champagne-400/15"
                        : "border-cream-300 bg-white hover:border-champagne-300"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        active ? "border-champagne-500 bg-champagne-500 text-white" : "border-cream-300"
                      }`}
                    >
                      {active && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-ink-950">{method.name}</span>
                      <span className="mt-0.5 block text-xs text-ink-600/70">{method.description}</span>
                    </span>
                    {method.id === "vnpay" && (
                      <span className="rounded bg-[#0B5FFF]/10 px-2 py-1 text-[10px] font-bold uppercase text-[#0B5FFF]">
                        Ưu tiên
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl bg-cream-100 p-4 text-[12px] leading-relaxed text-ink-700">
              <p className="flex items-center gap-2 font-semibold text-ink-900">
                <LockIcon className="h-4 w-4 text-champagne-600" /> Cam kết của AutoWeb
              </p>
              <ul className="mt-2 space-y-1.5 pl-6">
                <li className="list-disc">Hoàn cọc 100% nếu xe không đúng mô tả.</li>
                <li className="list-disc">Giữ nguyên giá bán tại thời điểm đặt cọc trong 15 ngày.</li>
                <li className="list-disc">Hỗ trợ hoàn cọc trong 48 giờ theo điều khoản.</li>
              </ul>
            </div>

            {deposit && (
              <div className="mt-5 flex flex-col gap-2 rounded-xl border border-dashed border-champagne-300 bg-champagne-50/60 px-4 py-3 text-xs text-ink-700 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Mã đơn giữ xe:{" "}
                  <span className="font-mono font-semibold text-ink-950">{deposit.code}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-3.5 w-3.5 text-champagne-600" /> Giữ xe{" "}
                  <span className="font-mono font-semibold">{holdLabel}</span>
                </span>
              </div>
            )}
            {submitError && <ErrorBanner message={submitError} />}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  setStep(1);
                }}
                disabled={submitting}
                className="btn-outline"
              >
                ← Quay lại
              </button>
              <button
                type="button"
                onClick={confirmPayment}
                disabled={submitting}
                className="btn-gold w-full gap-2 px-8 sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Spinner /> Đang xử lý giao dịch…
                  </>
                ) : (
                  <>
                    Xác nhận thanh toán {formatVnd(depositAmount)}
                    <ArrowRightIcon className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </section>

          <OrderSummary
            car={car}
            depositAmount={depositAmount}
            remaining={remaining}
            showroomName={`${showroom.name} — ${showroom.city}`}
            holdLabel={isAvailable ? holdLabel : null}
          />
        </div>
      )}

      {step === 3 && (
        <section className="mx-auto mt-8 max-w-2xl">
          <div className="card overflow-hidden">
            <div className="relative bg-ink-950 px-8 py-10 text-center text-cream-50">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `radial-gradient(circle at 50% 0%, ${car.accent}55, transparent 65%)`,
                }}
              />
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-champagne-400 text-ink-950">
                <CheckIcon className="h-8 w-8" strokeWidth={2.5} />
              </span>
              <h1 className="relative mt-5 font-display text-3xl">Đặt cọc thành công!</h1>
              <p className="relative mt-2 text-sm text-cream-100/70">
                Mã đơn của bạn:{" "}
                <span className="font-semibold tracking-wider text-champagne-300">
                  {deposit?.code ?? "—"}
                </span>
              </p>
            </div>
            <div className="space-y-4 px-6 py-7 sm:px-8">
              <SummaryRow label="Mẫu xe" value={car.name} />
              <SummaryRow label="Showroom" value={`${showroom.name} — ${showroom.city}`} />
              <SummaryRow label="Số tiền đã cọc" value={formatVnd(depositAmount)} strong />
              <SummaryRow label="Phương thức" value={PAYMENT_METHODS.find((m) => m.id === form.paymentMethod)?.name ?? ""} />
              <SummaryRow label="Ngày đặt cọc" value={formatDisplayDate(toIsoDate(new Date()))} />
              <div className="rounded-xl bg-cream-100 p-4 text-[13px] leading-relaxed text-ink-700">
                Chuyên viên tư vấn sẽ liên hệ với bạn qua số{" "}
                <span className="font-semibold text-ink-950">{form.phone}</span> trong vòng 30 phút để xác
                nhận hợp đồng và lịch giao xe dự kiến.
              </div>
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link href="/profile#bookings" className="btn-primary flex-1">
                  Xem đơn đặt cọc
                </Link>
                <Link href="/cars" className="btn-outline flex-1">
                  Tiếp tục khám phá
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------ Sub-components ----------------------------- */

function Stepper({ current }: { current: Step }) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1 sm:gap-4">
      {STEPS.map((item, index) => {
        const isActive = item.id === current;
        const isDone = item.id < current;
        return (
          <li key={item.id} className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition ${
                isDone
                  ? "border-ink-950 bg-ink-950 text-cream-50"
                  : isActive
                    ? "border-champagne-500 bg-champagne-50 text-champagne-600"
                    : "border-cream-300 bg-white text-ink-600/50"
              }`}
            >
              {isDone ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} /> : item.id}
            </span>
            <span
              className={`hidden whitespace-nowrap text-[12px] font-medium sm:block ${
                isActive ? "text-ink-950" : isDone ? "text-ink-700" : "text-ink-600/50"
              }`}
            >
              {item.label}
            </span>
            {index < STEPS.length - 1 && (
              <span
                className={`h-px flex-1 ${item.id < current ? "bg-ink-950/40" : "bg-cream-300"}`}
                aria-hidden
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function AvailabilityBanner({
  checking,
  availability,
  error,
  holdLabel,
  onRetry,
}: {
  checking: boolean;
  availability: AvailabilityDto | null;
  error?: string | null;
  holdLabel: string;
  onRetry: () => void;
}) {
  if (checking) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-champagne-200 bg-champagne-50 p-4">
        <span className="mt-0.5 text-champagne-600">
          <Spinner />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-950">Đang kiểm tra tình trạng xe…</p>
          <p className="mt-0.5 text-xs text-ink-600/75">
            Hệ thống đang đối chiếu tồn kho theo thời gian thực.
          </p>
        </div>
      </div>
    );
  }

  if (!availability) {
    if (!error) return null;
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
            <XIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Chưa kiểm tra được tình trạng xe</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 btn-outline bg-white px-4 py-2 text-xs"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (availability.status === "unavailable") {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-amber-300/70 bg-amber-50 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-800">
            <XIcon className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">Mẫu xe này tạm hết hàng</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-800/80">{availability.note}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={onRetry} className="btn-outline bg-white px-4 py-2 text-xs">
            Kiểm tra lại
          </button>
          <Link href="/cars" className="btn-primary px-4 py-2 text-xs">
            Xe tương tự
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
          <CheckIcon className="h-4 w-4" strokeWidth={3} />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink-950">
            Xe còn hàng · {availability.unitsLeft} chiếc sẵn sàng giao
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-600/75">{availability.note}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-800 shadow-sm">
        <ClockIcon className="h-3.5 w-3.5 text-champagne-600" />
        Giữ xe <span className="font-mono font-semibold">{holdLabel}</span>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-xl border border-rose-300/70 bg-rose-50 p-4">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700">
        <XIcon className="h-3.5 w-3.5" />
      </span>
      <p className="text-[13px] leading-relaxed text-rose-800">{message}</p>
    </div>
  );
}

function OrderSummary({
  car,
  depositAmount,
  remaining,
  showroomName,
  holdLabel,
}: {
  car: Car;
  depositAmount: number;
  remaining: number;
  showroomName: string;
  holdLabel: string | null;
}) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-luxe">
        <CarVisual car={car} variant="banner">
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-cream-100/70">{car.brand}</p>
              <p className="font-display text-lg text-cream-50">{car.name}</p>
            </div>
            <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium text-cream-50 backdrop-blur">
              {car.modelYear}
            </span>
          </div>
        </CarVisual>

        <div className="space-y-3 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600/55">
            Chi tiết thanh toán
          </p>
          <SummaryRow label="Giá niêm yết" value={formatVnd(car.price)} />
          {car.originalPrice && (
            <SummaryRow label="Ưu đãi" value={`- ${formatVnd(car.originalPrice - car.price)}`} tone="discount" />
          )}
          <SummaryRow label="Tiền đặt cọc" value={formatVnd(depositAmount)} tone="highlight" />
          <div className="divider-gold my-2" />
          <SummaryRow label="Còn lại khi nhận xe" value={formatVnd(remaining)} strong />
          <p className="text-[11px] leading-relaxed text-ink-600/60">
            Số tiền còn lại có thể thanh toán bằng vay trả góp (lãi suất từ 6,9%/năm) hoặc chuyển khoản.
          </p>

          <div className="rounded-xl bg-cream-100 p-3.5 text-[11px] leading-relaxed text-ink-700">
            <p className="flex items-center gap-1.5 font-semibold text-ink-900">
              <MapPinIcon className="h-3.5 w-3.5 text-champagne-600" /> Nhận xe tại
            </p>
            <p className="mt-1">{showroomName}</p>
          </div>

          {holdLabel && (
            <p className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-champagne-300 py-2 text-[11px] text-ink-700">
              <CalendarIcon className="h-3.5 w-3.5 text-champagne-600" />
              Ưu tiên giữ xe còn <span className="font-mono font-semibold">{holdLabel}</span>
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-ink-600/55">
        <ShieldIcon className="h-3.5 w-3.5" /> Giao dịch an toàn · Bảo mật SSL 256-bit
      </div>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "highlight" | "discount";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-ink-600/75">{label}</span>
      <span
        className={`text-right ${
          strong
            ? "font-display text-base font-semibold text-ink-950"
            : tone === "highlight"
              ? "font-semibold text-champagne-600"
              : tone === "discount"
                ? "font-medium text-emerald-500"
                : "font-medium text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  helper,
  required,
  autoComplete,
  inputMode,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "tel" | "email" | "text";
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-champagne-600">*</span>}
      </label>
      <input
        id={id}
        type={inputMode === "email" ? "email" : "text"}
        inputMode={inputMode === "email" ? undefined : inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`field ${error ? "field-error" : ""}`}
      />
      {error ? (
        <p id={`${id}-error`} className="field-error-text" role="alert">
          {error}
        </p>
      ) : (
        helper && <p className="field-hint">{helper}</p>
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
