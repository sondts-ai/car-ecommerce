"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatShortVnd, formatVnd, type Car } from "@/lib/cars";
import {
  SHOWROOMS,
  TEST_DRIVE_SLOTS,
  formatDisplayDate,
  toIsoDate,
  type FormErrors,
  validateEmail,
  validateFullName,
  validatePhone,
} from "@/lib/booking";
import { getErrorDetails, getErrorMessage, hasSession, testDrivesApi } from "@/lib/api";
import { CarVisual } from "@/components/site/cars/CarVisual";
import { StarRating } from "@/components/ui/StarRating";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/icons";

type TestDriveFormProps = {
  cars: Car[];
  initialCarSlug?: string;
};

type TestDriveState = {
  carSlug: string;
  showroomId: string;
  date: string;
  time: string;
  fullName: string;
  phone: string;
  email: string;
  note: string;
  hasLicense: boolean;
  agree: boolean;
};

const MAX_DAYS_AHEAD = 14;

function buildSelectableDates(): { iso: string; weekday: string; day: string; month: string; isToday: boolean }[] {
  const today = new Date();
  return Array.from({ length: MAX_DAYS_AHEAD }).map((_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return {
      iso: toIsoDate(date),
      weekday: date.toLocaleDateString("vi-VN", { weekday: "short" }),
      day: String(date.getDate()).padStart(2, "0"),
      month: `Th${date.getMonth() + 1}`,
      isToday: index === 0,
    };
  });
}

export function TestDriveForm({ cars, initialCarSlug }: TestDriveFormProps) {
  const dates = useMemo(buildSelectableDates, []);
  const [form, setForm] = useState<TestDriveState>({
    carSlug: initialCarSlug ?? cars[0]?.slug ?? "",
    showroomId: SHOWROOMS[0].id,
    date: dates[0]?.iso ?? "",
    time: "",
    fullName: "",
    phone: "",
    email: "",
    note: "",
    hasLicense: false,
    agree: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loginRequired, setLoginRequired] = useState(false);
  const [success, setSuccess] = useState<{ code: string; date: string; time: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [slotAvailability, setSlotAvailability] = useState<Record<string, boolean>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => setMounted(true), []);

  /* Tải khung giờ còn trống từ mock API mỗi khi đổi xe / showroom / ngày */
  useEffect(() => {
    if (!form.carSlug || !form.showroomId || !form.date) return;
    let cancelled = false;
    setLoadingSlots(true);
    testDrivesApi
      .slots({ carSlug: form.carSlug, showroomId: form.showroomId, date: form.date })
      .then((result) => {
        if (cancelled) return;
        const map = Object.fromEntries(result.slots.map((slot) => [slot.time, slot.available]));
        setSlotAvailability(map);
        setForm((prev) =>
          prev.time && map[prev.time] === false ? { ...prev, time: "" } : prev,
        );
      })
      .catch(() => {
        if (!cancelled) setSlotAvailability({});
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.carSlug, form.showroomId, form.date]);

  const selectedCar = cars.find((car) => car.slug === form.carSlug) ?? cars[0];
  const showroom = SHOWROOMS.find((item) => item.id === form.showroomId) ?? SHOWROOMS[0];

  const update = <K extends keyof TestDriveState>(key: K, value: TestDriveState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      if (key === "showroomId" || key === "date") delete next.time;
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.time) nextErrors.time = "Vui lòng chọn khung giờ lái thử.";
    const nameError = validateFullName(form.fullName);
    if (nameError) nextErrors.fullName = nameError;
    const phoneError = validatePhone(form.phone);
    if (phoneError) nextErrors.phone = phoneError;
    const emailError = validateEmail(form.email);
    if (emailError) nextErrors.email = emailError;
    if (!form.hasLicense) nextErrors.hasLicense = "Bạn cần có giấy phép lái xe hợp lệ để lái thử.";
    if (!form.agree) nextErrors.agree = "Vui lòng đồng ý với điều khoản lái thử.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!hasSession()) {
      setLoginRequired(true);
      setSubmitError("Đăng nhập để gửi yêu cầu và theo dõi lịch hẹn trong hồ sơ của bạn.");
      return;
    }
    setLoginRequired(false);
    if (!validate()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      /* UC: Đặt lịch lái thử — backend kiểm tra trùng khung giờ */
      const booking = await testDrivesApi.create({
        carSlug: form.carSlug,
        carName: selectedCar?.name ?? form.carSlug,
        showroomId: form.showroomId,
        date: form.date,
        time: form.time,
        note: form.note.trim() || undefined,
        hasLicense: form.hasLicense,
        customer: {
          fullName: form.fullName.trim(),
          phone: form.phone,
          email: form.email.trim() || undefined,
        },
      });
      setSuccess({ code: booking.code, date: booking.date, time: booking.time });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const details = getErrorDetails(error);
      if (Object.keys(details).length > 0) setErrors((prev) => ({ ...prev, ...details }));
      setSubmitError(getErrorMessage(error, "Không thể đặt lịch lái thử. Vui lòng thử lại."));
    } finally {
      setSubmitting(false);
    }
  };

  if (success && selectedCar) {
    return (
      <section className="container-luxe py-12 lg:py-16">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-luxe">
          <div className="relative bg-ink-950 px-8 py-10 text-center text-cream-50">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ backgroundImage: `radial-gradient(circle at 50% 0%, ${selectedCar.accent}55, transparent 65%)` }}
            />
            <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-champagne-400 text-ink-950">
              <CheckIcon className="h-8 w-8" strokeWidth={2.5} />
            </span>
            <h1 className="relative mt-5 font-display text-3xl">Đã gửi yêu cầu lái thử</h1>
            <p className="relative mt-2 text-sm text-cream-100/70">
              Mã lịch hẹn: <span className="font-semibold tracking-wider text-champagne-300">{success.code}</span>
            </p>
          </div>

          <div className="space-y-4 px-6 py-7 sm:px-8">
            <div className="rounded-xl border border-champagne-200 bg-champagne-50 p-4">
              <p className="font-display text-xl text-ink-950">{selectedCar.name}</p>
              <p className="mt-1 text-sm text-ink-600/80">
                {formatDisplayDate(success.date)} · {success.time} · 30 phút
              </p>
              <p className="mt-1 text-sm text-ink-600/80">
                {showroom.name} — {showroom.address}
              </p>
            </div>
            <p className="text-[13px] leading-relaxed text-ink-700">
              Lịch đang <span className="font-semibold">chờ Admin xác nhận</span>. Bạn có thể theo dõi
              trạng thái hoặc hủy lịch trong mục “Quản lý lịch hẹn”. Chỉ đến showroom sau khi lịch
              được xác nhận.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Link href="/profile" className="btn-primary flex-1">
                Quản lý lịch hẹn
              </Link>
              <Link href="/cars" className="btn-outline flex-1">
                Xem thêm mẫu xe
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-luxe py-10 lg:py-14">
      <div className="max-w-2xl">
        <p className="eyebrow">Trải nghiệm trước khi sở hữu</p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink-950 sm:text-5xl">
          Đặt lịch lái thử
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-700/80">
          Chọn mẫu xe, showroom và khung giờ phù hợp. Trải nghiệm 30 phút cùng chuyên viên tư vấn — hoàn
          toàn miễn phí.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <form onSubmit={submit} className="card p-6 sm:p-8" noValidate>
          {/* 1. Chọn xe */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="td-car" className="field-label">
                Mẫu xe muốn lái thử <span className="text-champagne-600">*</span>
              </label>
              <div className="relative">
                <select
                  id="td-car"
                  value={form.carSlug}
                  onChange={(event) => update("carSlug", event.target.value)}
                  className="field appearance-none pr-10"
                >
                  {cars.map((car) => (
                    <option key={car.id} value={car.slug}>
                      {car.name} — từ {formatShortVnd(car.price)}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="td-showroom" className="field-label">
                Showroom <span className="text-champagne-600">*</span>
              </label>
              <div className="relative">
                <select
                  id="td-showroom"
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
                <MapPinIcon className="h-3.5 w-3.5" /> {showroom.address}
              </p>
            </div>
          </div>

          <div className="my-7 divider-gold" />

          {/* 2. Chọn ngày */}
          <div>
            <div className="flex items-baseline justify-between">
              <p className="field-label mb-0">
                Ngày lái thử <span className="text-champagne-600">*</span>
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-600/60">
                <CalendarIcon className="h-3.5 w-3.5" /> {formatDisplayDate(form.date)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
              {dates.map((date) => {
                const active = form.date === date.iso;
                return (
                  <button
                    key={date.iso}
                    type="button"
                    onClick={() => update("date", date.iso)}
                    aria-pressed={active}
                    className={`flex flex-col items-center rounded-xl border py-2.5 transition ${
                      active
                        ? "border-ink-950 bg-ink-950 text-cream-50"
                        : "border-cream-300 bg-white text-ink-800 hover:border-champagne-400"
                    }`}
                  >
                    <span className={`text-[10px] uppercase tracking-wider ${active ? "text-champagne-300" : "text-ink-600/55"}`}>
                      {date.isToday ? "Hôm nay" : date.weekday}
                    </span>
                    <span className="font-display text-lg leading-tight">{date.day}</span>
                    <span className={`text-[10px] ${active ? "text-cream-100/60" : "text-ink-600/50"}`}>
                      {date.month}
                    </span>
                  </button>
                );
              })}
            </div>
            {mounted && (
              <div className="mt-3 relative">
                <input
                  type="date"
                  value={form.date}
                  min={toIsoDate(new Date())}
                  onChange={(event) => update("date", event.target.value)}
                  aria-label="Chọn ngày khác"
                  className="field h-10 w-full text-sm sm:w-60"
                />
              </div>
            )}
          </div>

          {/* 3. Chọn giờ */}
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <p className="field-label mb-0">
                Khung giờ <span className="text-champagne-600">*</span>
              </p>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-600/60">
                <ClockIcon className="h-3.5 w-3.5" /> Mỗi lượt 30 phút
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
              {TEST_DRIVE_SLOTS.map((slot) => {
                const disabled = loadingSlots || slotAvailability[slot] === false;
                const active = form.time === slot;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    onClick={() => update("time", slot)}
                    aria-pressed={active}
                    title={disabled ? "Khung giờ đã kín" : undefined}
                    className={`rounded-lg border py-2.5 text-sm font-medium transition ${
                      disabled
                        ? "cursor-not-allowed border-cream-200 bg-cream-100 text-ink-600/30 line-through"
                        : active
                          ? "border-champagne-500 bg-champagne-50 text-ink-950 ring-4 ring-champagne-400/15"
                          : "border-cream-300 bg-white text-ink-800 hover:border-champagne-400"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            {errors.time ? (
              <p className="field-error-text" role="alert">
                {errors.time}
              </p>
            ) : loadingSlots ? (
              <p className="field-hint">Đang tải khung giờ còn trống…</p>
            ) : (
              <p className="field-hint">Khung giờ gạch ngang đã được đặt kín tại showroom này.</p>
            )}
          </div>

          <div className="my-7 divider-gold" />

          {/* 4. Thông tin liên hệ */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600/60">
              Thông tin liên hệ
            </p>
            <div className="mt-3 grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="td-name" className="field-label">
                  Họ và tên <span className="text-champagne-600">*</span>
                </label>
                <input
                  id="td-name"
                  value={form.fullName}
                  onChange={(event) => update("fullName", event.target.value)}
                  autoComplete="name"
                  placeholder="Nguyễn Văn An"
                  aria-invalid={Boolean(errors.fullName)}
                  className={`field ${errors.fullName ? "field-error" : ""}`}
                />
                {errors.fullName && <p className="field-error-text" role="alert">{errors.fullName}</p>}
              </div>
              <div>
                <label htmlFor="td-phone" className="field-label">
                  Số điện thoại <span className="text-champagne-600">*</span>
                </label>
                <input
                  id="td-phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  autoComplete="tel"
                  placeholder="0901 234 567"
                  aria-invalid={Boolean(errors.phone)}
                  className={`field ${errors.phone ? "field-error" : ""}`}
                />
                {errors.phone && <p className="field-error-text" role="alert">{errors.phone}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="td-email" className="field-label">
                  Email
                </label>
                <input
                  id="td-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  autoComplete="email"
                  placeholder="ban@email.com"
                  aria-invalid={Boolean(errors.email)}
                  className={`field ${errors.email ? "field-error" : ""}`}
                />
                {errors.email ? (
                  <p className="field-error-text" role="alert">{errors.email}</p>
                ) : (
                  <p className="field-hint">Nhận xác nhận lịch hẹn và mã QR check-in qua email.</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="td-note" className="field-label">
                  Yêu cầu thêm
                </label>
                <textarea
                  id="td-note"
                  rows={3}
                  value={form.note}
                  onChange={(event) => update("note", event.target.value)}
                  placeholder="Ví dụ: Muốn trải nghiệm cung đường cao tốc, có trẻ nhỏ đi cùng…"
                  className="field resize-none"
                />
              </div>
            </div>
          </div>

          {/* 5. Điều kiện */}
          <div className="mt-6 space-y-3">
            <ConsentCheckbox
              checked={form.hasLicense}
              onChange={(checked) => update("hasLicense", checked)}
              error={errors.hasLicense}
            >
              Tôi có giấy phép lái xe hợp lệ và đủ 18 tuổi trở lên.
            </ConsentCheckbox>
            <ConsentCheckbox
              checked={form.agree}
              onChange={(checked) => update("agree", checked)}
              error={errors.agree}
            >
              Tôi đồng ý với{" "}
              <span className="font-medium text-ink-950 underline underline-offset-2">
                điều khoản lái thử
              </span>{" "}
              và cho phép AutoWeb liên hệ xác nhận lịch hẹn.
            </ConsentCheckbox>
          </div>

          {submitError && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-300/70 bg-rose-50 p-4">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700">
                <XIcon className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-[13px] leading-relaxed text-rose-800">{submitError}</p>
                {loginRequired && (
                  <Link href="/login" className="mt-2 inline-flex text-sm font-semibold text-ink-900 underline">
                    Đăng nhập để tiếp tục
                  </Link>
                )}
              </div>
            </div>
          )}

          <div className="mt-7 flex flex-col gap-3 border-t border-cream-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-2 text-xs text-ink-600/60">
              <ShieldIcon className="h-4 w-4 text-champagne-600" /> Miễn phí · Không cần đặt cọc
            </p>
            <button type="submit" disabled={submitting} className="btn-primary gap-2 px-8">
              {submitting ? (
                <>
                  <Spinner /> Đang giữ lịch…
                </>
              ) : (
                <>
                  Xác nhận đặt lịch
                  <ArrowRightIcon className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Tóm tắt lịch hẹn */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-luxe">
            {selectedCar && (
              <CarVisual car={selectedCar} variant="banner">
                <div className="absolute inset-x-0 bottom-0 z-10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cream-100/70">{selectedCar.brand}</p>
                  <p className="font-display text-lg text-cream-50">{selectedCar.name}</p>
                </div>
              </CarVisual>
            )}

            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600/55">
                  Lịch hẹn của bạn
                </p>
                {selectedCar && <StarRating value={selectedCar.rating} size="sm" showValue />}
              </div>

              <div className="space-y-3 rounded-xl bg-cream-100 p-4 text-sm text-ink-800">
                <p className="flex items-start gap-2.5">
                  <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" />
                  <span>
                    <span className="block font-medium">{formatDisplayDate(form.date)}</span>
                    <span className="text-xs text-ink-600/70">{form.time || "Chưa chọn giờ"} · 30 phút</span>
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" />
                  <span>
                    <span className="block font-medium">{showroom.name}</span>
                    <span className="text-xs text-ink-600/70">{showroom.address}</span>
                  </span>
                </p>
                <p className="flex items-start gap-2.5">
                  <PhoneIcon className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" />
                  <span className="text-xs text-ink-600/70">Hotline showroom: {showroom.hotline}</span>
                </p>
                {selectedCar && (
                  <p className="flex items-start gap-2.5">
                    <UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-champagne-600" />
                    <span className="text-xs text-ink-600/70">
                      Tối đa 2 khách đi cùng · Giá niêm yết {formatVnd(selectedCar.price)}
                    </span>
                  </p>
                )}
              </div>

              <ul className="space-y-2 text-[11px] leading-relaxed text-ink-600/70">
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                  Xe được vệ sinh và kiểm tra kỹ thuật trước mỗi lượt lái.
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                  Hỗ trợ đổi lịch miễn phí trước 6 giờ.
                </li>
                <li className="flex gap-2">
                  <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                  Không phát sinh bất kỳ chi phí nào.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-ink-700">
        <span
          className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
            checked ? "border-ink-950 bg-ink-950 text-cream-50" : "border-cream-300 bg-white"
          } ${error ? "border-red-400" : ""}`}
        >
          {checked && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
        </span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span>{children}</span>
      </label>
      {error && <p className="field-error-text ml-8" role="alert">{error}</p>}
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
