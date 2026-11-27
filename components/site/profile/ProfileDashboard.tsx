"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CARS, formatVnd, type Car } from "@/lib/cars";
import {
  SHOWROOMS,
  formatDisplayDate,
  validateEmail,
  validateFullName,
  validatePhone,
  type FormErrors,
} from "@/lib/booking";
import {
  API_CONFIG,
  authApi,
  clearTokens,
  depositsApi,
  getErrorDetails,
  getErrorMessage,
  hasSession,
  ordersApi,
  profileApi,
  testDrivesApi,
} from "@/lib/api";
import type { DepositDto, DepositStatus, OrderDto, TestDriveDto, TestDriveStatus } from "@/lib/api/types";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  LockIcon,
  MailIcon,
  MapPinIcon,
  ShieldIcon,
  UserIcon,
} from "@/components/ui/icons";

type Tab = "info" | "security" | "bookings";

type BookingRow = {
  id: string;
  type: "Đặt cọc" | "Lái thử";
  car: Car;
  status: string;
  statusTone: string;
  detail: string;
  date: string;
  price?: number;
  testDriveId?: string;
  canCancel?: boolean;
};

/* Dữ liệu mẫu hiển thị khi chưa đăng nhập (demo) */
const SEED_BOOKINGS: BookingRow[] = [
  {
    id: "DC-20261112-8F2K",
    type: "Đặt cọc",
    car: CARS[1],
    status: "Đang xử lý",
    statusTone: "bg-amber-100 text-amber-800",
    detail: "Đã cọc 50.000.000 ₫ · Showroom Tây Hồ",
    date: "12/11/2026",
    price: CARS[1].price,
  },
  {
    id: "TD-20261109-3QW1",
    type: "Lái thử",
    car: CARS[3],
    status: "Đã xác nhận",
    statusTone: "bg-emerald-500/12 text-emerald-700",
    detail: "14:30 · 20/11/2026 · Showroom Phú Mỹ Hưng",
    date: "09/11/2026",
  },
  {
    id: "DC-20260928-7LZ4",
    type: "Đặt cọc",
    car: CARS[4],
    status: "Hoàn tất",
    statusTone: "bg-ink-950/8 text-ink-800",
    detail: "Đã nhận xe · Bảo hành đến 09/2031",
    date: "28/09/2026",
    price: CARS[4].price,
  },
];

const DEPOSIT_STATUS_META: Record<DepositStatus, { label: string; tone: string }> = {
  pending_payment: { label: "Chờ thanh toán", tone: "bg-amber-100 text-amber-800" },
  paid: { label: "Đã thanh toán", tone: "bg-emerald-500/12 text-emerald-700" },
  confirmed: { label: "Đã xác nhận", tone: "bg-emerald-500/12 text-emerald-700" },
  cancelled: { label: "Đã huỷ", tone: "bg-ink-950/8 text-ink-600" },
  completed: { label: "Hoàn tất", tone: "bg-ink-950/8 text-ink-800" },
};

const TEST_DRIVE_STATUS_META: Record<TestDriveStatus, { label: string; tone: string }> = {
  pending: { label: "Đang chờ Admin xác nhận", tone: "bg-amber-100 text-amber-800" },
  confirmed: { label: "Đã xác nhận", tone: "bg-emerald-500/12 text-emerald-700" },
  completed: { label: "Hoàn tất", tone: "bg-ink-950/8 text-ink-800" },
  cancelled: { label: "Đã huỷ", tone: "bg-ink-950/8 text-ink-600" },
  rejected: { label: "Bị từ chối", tone: "bg-red-100 text-red-800" },
};

function carBySlug(slug: string): Car {
  return CARS.find((car) => car.slug === slug) ?? CARS[0];
}

function showroomLabel(id: string): string {
  const showroom = SHOWROOMS.find((item) => item.id === id);
  return showroom ? `${showroom.name} · ${showroom.city}` : id;
}

function formatCreatedAt(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function toDepositRow(deposit: DepositDto): BookingRow {
  const meta = DEPOSIT_STATUS_META[deposit.status];
  return {
    id: deposit.code,
    type: "Đặt cọc",
    car: carBySlug(deposit.carSlug),
    status: meta.label,
    statusTone: meta.tone,
    detail: `${formatVnd(deposit.amount)} · ${showroomLabel(deposit.showroomId)}`,
    date: formatCreatedAt(deposit.createdAt),
    price: carBySlug(deposit.carSlug).price,
  };
}

function toTestDriveRow(testDrive: TestDriveDto): BookingRow {
  const meta = TEST_DRIVE_STATUS_META[testDrive.status];
  return {
    id: testDrive.code,
    type: "Lái thử",
    car: carBySlug(testDrive.carSlug),
    status: meta.label,
    statusTone: meta.tone,
    detail: `${testDrive.time} · ${formatDisplayDate(testDrive.date)} · ${showroomLabel(testDrive.showroomId)}`,
    date: formatCreatedAt(testDrive.createdAt),
    testDriveId: testDrive.id,
    canCancel: testDrive.status === "pending" || testDrive.status === "confirmed",
  };
}

const ORDER_STATUS_META: Record<OrderDto["status"], { label: string; tone: string }> = {
  PENDING_DEPOSIT: { label: "Chờ đặt cọc", tone: "bg-amber-100 text-amber-800" },
  DEPOSIT_PAID: { label: "Đã đặt cọc", tone: "bg-emerald-500/12 text-emerald-700" },
  CONFIRMED: { label: "Đã xác nhận", tone: "bg-emerald-500/12 text-emerald-700" },
  WAITING_REMAINING_PAYMENT: { label: "Chờ thanh toán", tone: "bg-amber-100 text-amber-800" },
  COMPLETED: { label: "Hoàn tất", tone: "bg-ink-950/8 text-ink-800" },
  CANCELLED: { label: "Đã huỷ", tone: "bg-ink-950/8 text-ink-600" },
  EXPIRED: { label: "Đã hết hạn", tone: "bg-ink-950/8 text-ink-600" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "bg-ink-950/8 text-ink-600" },
};

function toOrderRow(order: OrderDto): BookingRow {
  const item = order.items[0];
  const car = CARS.find((candidate) => candidate.name === item?.vehicleName) ?? CARS[0];
  const meta = ORDER_STATUS_META[order.status];
  return {
    id: order.orderCode,
    type: "Đặt cọc",
    car,
    status: meta.label,
    statusTone: meta.tone,
    detail: `${formatVnd(order.depositAmount)} · Mã xe ${item?.vehicleId ?? "—"}`,
    date: formatCreatedAt(order.createdAt),
    price: Number(item?.price ?? order.totalAmount),
  };
}

type ProfileState = {
  fullName: string;
  phone: string;
  email: string;
  birthday: string;
  address: string;
  city: string;
  newsletter: boolean;
};

const INITIAL_PROFILE: ProfileState = {
  fullName: "Nguyễn Văn An",
  phone: "0901234567",
  email: "an.nguyen@email.com",
  birthday: "1990-05-18",
  address: "Số 25 Lý Thường Kiệt, Q. Hoàn Kiếm",
  city: "Hà Nội",
  newsletter: true,
};

export function ProfileDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [profile, setProfile] = useState<ProfileState>(INITIAL_PROFILE);
  const [profileErrors, setProfileErrors] = useState<FormErrors>({});
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("08/11/2026");
  const [bookings, setBookings] = useState<BookingRow[]>(SEED_BOOKINGS);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<FormErrors>({});
  const [twoFactor, setTwoFactor] = useState(false);

  // Deep link: /profile#bookings, /profile#security
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "bookings" || hash === "security") setTab(hash);
  }, []);

  /* Tải hồ sơ + đơn hàng từ API (chỉ khi đã đăng nhập) */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!hasSession()) {
        setLoadingProfile(false);
        return;
      }
      try {
        const me = await profileApi.getMe();
        if (cancelled) return;
        setProfile({
          fullName: me.fullName,
          phone: me.phone,
          email: me.email,
          birthday: me.birthday ?? "",
          address: me.address ?? "",
          city: me.city ?? "Hà Nội",
          newsletter: me.newsletter,
        });
        setLastUpdated(formatCreatedAt(me.updatedAt));

        const [depositsResult, testDrivesResult, ordersResult] = await Promise.allSettled([
          API_CONFIG.useBackendServices ? Promise.resolve([] as DepositDto[]) : depositsApi.list(),
          testDrivesApi.list(),
          ordersApi.list(),
        ]);
        if (cancelled) return;
        const rows: BookingRow[] = [];
        if (depositsResult.status === "fulfilled") rows.push(...depositsResult.value.map(toDepositRow));
        if (testDrivesResult.status === "fulfilled") rows.push(...testDrivesResult.value.map(toTestDriveRow));
        if (ordersResult.status === "fulfilled") rows.push(...ordersResult.value.map(toOrderRow));
        setBookings(rows.length > 0 ? rows : []);
        if (
          testDrivesResult.status === "rejected" ||
          ordersResult.status === "rejected" ||
          (!API_CONFIG.useBackendServices && depositsResult.status === "rejected")
        ) {
          setErrorMessage("Không tải được đầy đủ đơn đặt cọc và lịch hẹn. Vui lòng tải lại trang để thử lại.");
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(getErrorMessage(error, "Không thể tải hồ sơ. Vui lòng thử lại."));
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const cancelTestDrive = async (booking: BookingRow) => {
    if (!booking.testDriveId || !booking.canCancel) return;
    if (!window.confirm(`Bạn muốn hủy lịch lái thử ${booking.id}?`)) return;

    setCancellingBookingId(booking.id);
    setErrorMessage("");
    setSavedMessage("");
    try {
      const updated = await testDrivesApi.cancel(booking.testDriveId);
      setBookings((current) =>
        current.map((item) => item.id === booking.id ? toTestDriveRow(updated) : item),
      );
      setSavedMessage(`Đã hủy lịch lái thử ${booking.id}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể hủy lịch lái thử. Vui lòng thử lại."));
    } finally {
      setCancellingBookingId(null);
    }
  };

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  const passwordStrength = useMemo(() => {
    const value = passwords.next;
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score;
  }, [passwords.next]);

  const updateProfile = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setProfileErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      return next;
    });
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const nameError = validateFullName(profile.fullName);
    if (nameError) nextErrors.fullName = nameError;
    const phoneError = validatePhone(profile.phone);
    if (phoneError) nextErrors.phone = phoneError;
    const emailError = validateEmail(profile.email, true);
    if (emailError) nextErrors.email = emailError;
    if (!API_CONFIG.useBackendServices && !profile.address.trim()) {
      nextErrors.address = "Vui lòng nhập địa chỉ liên hệ.";
    }
    setProfileErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!hasSession()) {
      setSavedMessage("Thông tin đã được cập nhật (chế độ demo — chưa đăng nhập).");
      window.setTimeout(() => setSavedMessage(""), 3500);
      return;
    }

    setSavingProfile(true);
    setErrorMessage("");
    try {
      const updated = await profileApi.updateMe({
        fullName: profile.fullName.trim(),
        phone: profile.phone,
        birthday: profile.birthday || undefined,
        address: profile.address,
        city: profile.city,
        newsletter: profile.newsletter,
      });
      setProfile((prev) => ({
        ...prev,
        fullName: updated.fullName,
        phone: updated.phone,
        birthday: updated.birthday ?? "",
        address: updated.address ?? "",
        city: updated.city ?? prev.city,
        newsletter: updated.newsletter,
      }));
      setLastUpdated(formatCreatedAt(updated.updatedAt));
      setSavedMessage("Thông tin cá nhân đã được cập nhật.");
      window.setTimeout(() => setSavedMessage(""), 3500);
    } catch (error) {
      const details = getErrorDetails(error);
      if (Object.keys(details).length > 0) {
        setProfileErrors((prev) => ({ ...prev, ...details }));
      }
      setErrorMessage(getErrorMessage(error, "Không thể lưu thông tin. Vui lòng thử lại."));
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProfile = async () => {
    setProfileErrors({});
    if (!hasSession()) {
      setProfile(INITIAL_PROFILE);
      return;
    }
    try {
      const me = await profileApi.getMe();
      setProfile({
        fullName: me.fullName,
        phone: me.phone,
        email: me.email,
        birthday: me.birthday ?? "",
        address: me.address ?? "",
        city: me.city ?? "Hà Nội",
        newsletter: me.newsletter,
      });
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Không thể tải lại hồ sơ."));
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (!passwords.current) nextErrors.current = "Vui lòng nhập mật khẩu hiện tại.";
    if (passwords.next.length < 8) nextErrors.next = "Mật khẩu mới phải có ít nhất 8 ký tự.";
    else if (passwordStrength < 2) nextErrors.next = "Mật khẩu mới quá yếu.";
    else if (passwords.next === passwords.current) nextErrors.next = "Mật khẩu mới phải khác mật khẩu hiện tại.";
    if (passwords.next !== passwords.confirm) nextErrors.confirm = "Mật khẩu xác nhận không khớp.";
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!hasSession()) {
      setPasswords({ current: "", next: "", confirm: "" });
      setSavedMessage("Mật khẩu đã được thay đổi (chế độ demo — chưa đăng nhập).");
      window.setTimeout(() => setSavedMessage(""), 4000);
      return;
    }

    setSavingPassword(true);
    setErrorMessage("");
    try {
      await authApi.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: "", next: "", confirm: "" });
      setSavedMessage("Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại trên thiết bị khác.");
      window.setTimeout(() => setSavedMessage(""), 4000);
    } catch (error) {
      const details = getErrorDetails(error);
      if (Object.keys(details).length > 0) {
        setPasswordErrors((prev) => ({ ...prev, ...details }));
      }
      setErrorMessage(getErrorMessage(error, "Không thể đổi mật khẩu. Vui lòng thử lại."));
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      clearTokens();
    }
    router.push("/login");
    router.refresh();
  };

  const TABS: { id: Tab; label: string; icon: typeof UserIcon }[] = [
    { id: "info", label: "Thông tin cá nhân", icon: UserIcon },
    { id: "security", label: "Bảo mật & mật khẩu", icon: LockIcon },
    { id: "bookings", label: "Đơn hàng & lịch hẹn", icon: CalendarIcon },
  ];

  return (
    <div className="container-luxe py-10 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card">
            <div className="relative bg-ink-950 px-5 pb-5 pt-6 text-cream-50">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{ backgroundImage: "radial-gradient(circle at 80% 0%, rgba(201,169,106,0.4), transparent 60%)" }}
              />
              <div className="relative flex items-center gap-3">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-champagne-400/50 bg-white/5 font-display text-lg text-champagne-300">
                  {initials || "AB"}
                </span>
                <div>
                  <p className="font-display text-lg leading-tight">{profile.fullName}</p>
                  <p className="mt-0.5 text-[11px] text-cream-100/60">{profile.email}</p>
                </div>
              </div>
              <div className="relative mt-4 flex items-center gap-2 rounded-lg border border-champagne-400/25 bg-champagne-400/10 px-3 py-2">
                <ShieldIcon className="h-4 w-4 text-champagne-300" />
                <span className="text-[11px] text-cream-100/80">Thành viên Kim Cương</span>
              </div>
            </div>

            <nav className="p-2">
              {TABS.map((item) => {
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                      active ? "bg-ink-950 text-cream-50" : "text-ink-700 hover:bg-cream-100"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${active ? "text-champagne-300" : "text-ink-600/60"}`} />
                    {item.label}
                  </button>
                );
              })}
              <div className="my-2 h-px bg-cream-200" />
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-ink-600/70 transition hover:bg-cream-100 hover:text-ink-950"
              >
                <LockIcon className="h-4 w-4" /> Đăng xuất
              </button>
            </nav>
          </div>

          <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-600/55">Quyền lợi</p>
            <ul className="mt-3 space-y-2 text-[12px] text-ink-700">
              {["Ưu đãi 50 triệu", "Bảo dưỡng miễn phí 3 năm", "Hotline riêng 24/7"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0">
          {errorMessage && (
            <div className="mb-4 rounded-xl border border-red-300/70 bg-red-50 px-4 py-3 text-[13px] text-red-700" role="alert">
              {errorMessage}
            </div>
          )}

          {loadingProfile && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-cream-200 bg-white px-4 py-3 text-[13px] text-ink-600/70">
              Đang tải hồ sơ của bạn…
            </div>
          )}

          {savedMessage && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-[13px] text-emerald-700">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3} />
              {savedMessage}
            </div>
          )}

          {tab === "info" && (
            <section className="card p-6 sm:p-8">
              <header className="mb-6">
                <p className="eyebrow">Hồ sơ khách hàng</p>
                <h1 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Thông tin cá nhân</h1>
                <p className="mt-2 text-sm text-ink-600/75">
                  Cập nhật thông tin liên hệ để nhận hợp đồng, hoá đơn và thông báo từ AutoWeb.
                </p>
              </header>

              <form onSubmit={saveProfile} className="space-y-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="pf-name" className="field-label">Họ và tên</label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                      <input
                        id="pf-name"
                        value={profile.fullName}
                        onChange={(event) => updateProfile("fullName", event.target.value)}
                        className={`field pl-11 ${profileErrors.fullName ? "field-error" : ""}`}
                      />
                    </div>
                    {profileErrors.fullName && <p className="field-error-text">{profileErrors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="pf-phone" className="field-label">Số điện thoại</label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                      <input
                        id="pf-phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(event) => updateProfile("phone", event.target.value)}
                        disabled={API_CONFIG.useBackendServices}
                        className={`field pl-11 ${profileErrors.phone ? "field-error" : ""}`}
                      />
                    </div>
                    {profileErrors.phone && <p className="field-error-text">{profileErrors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="pf-email" className="field-label">Email</label>
                    <div className="relative">
                      <MailIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                      <input
                        id="pf-email"
                        type="email"
                        value={profile.email}
                        onChange={(event) => updateProfile("email", event.target.value)}
                        disabled={API_CONFIG.useBackendServices}
                        className={`field pl-11 ${profileErrors.email ? "field-error" : ""}`}
                      />
                    </div>
                    {profileErrors.email && <p className="field-error-text">{profileErrors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="pf-birthday" className="field-label">Ngày sinh</label>
                    <input
                      id="pf-birthday"
                      type="date"
                      value={profile.birthday}
                      onChange={(event) => updateProfile("birthday", event.target.value)}
                      className="field"
                    />
                  </div>
                  {!API_CONFIG.useBackendServices && (
                    <>
                      <div className="sm:col-span-2">
                        <label htmlFor="pf-address" className="field-label">Địa chỉ liên hệ</label>
                        <div className="relative">
                          <MapPinIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                          <input
                            id="pf-address"
                            value={profile.address}
                            onChange={(event) => updateProfile("address", event.target.value)}
                            className={`field pl-11 ${profileErrors.address ? "field-error" : ""}`}
                          />
                        </div>
                        {profileErrors.address && <p className="field-error-text">{profileErrors.address}</p>}
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="pf-city" className="field-label">Tỉnh / Thành phố</label>
                        <select
                          id="pf-city"
                          value={profile.city}
                          onChange={(event) => updateProfile("city", event.target.value)}
                          className="field"
                        >
                          {["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Khác"].map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {!API_CONFIG.useBackendServices && (
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream-100 p-4 text-[12px] leading-relaxed text-ink-700">
                    <span
                      className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
                        profile.newsletter ? "border-ink-950 bg-ink-950 text-cream-50" : "border-cream-300 bg-white"
                      }`}
                    >
                      {profile.newsletter && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <input
                      type="checkbox"
                      checked={profile.newsletter}
                      onChange={(event) => updateProfile("newsletter", event.target.checked)}
                      className="sr-only"
                    />
                    <span>
                      Nhận email về ưu đãi, xe mới ra mắt và lời mời trải nghiệm đặc biệt từ AutoWeb.
                    </span>
                  </label>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-cream-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[11px] text-ink-600/55">
                    Thông tin được cập nhật lần cuối: {lastUpdated}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetProfile}
                      disabled={savingProfile}
                      className="btn-outline"
                    >
                      Huỷ thay đổi
                    </button>
                    <button type="submit" disabled={savingProfile} className="btn-primary px-7">
                      {savingProfile ? "Đang lưu…" : "Lưu thông tin"}
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {tab === "security" && (
            <section className="card p-6 sm:p-8">
              <header className="mb-6">
                <p className="eyebrow">Bảo mật tài khoản</p>
                <h1 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Đổi mật khẩu</h1>
                <p className="mt-2 text-sm text-ink-600/75">
                  Sử dụng mật khẩu mạnh và không dùng lại cho các dịch vụ khác.
                </p>
              </header>

              <form onSubmit={changePassword} className="max-w-lg space-y-5" noValidate>
                <div>
                  <label htmlFor="sec-current" className="field-label">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                    <input
                      id="sec-current"
                      type="password"
                      value={passwords.current}
                      onChange={(event) => setPasswords((prev) => ({ ...prev, current: event.target.value }))}
                      autoComplete="current-password"
                      className={`field pl-11 ${passwordErrors.current ? "field-error" : ""}`}
                    />
                  </div>
                  {passwordErrors.current && <p className="field-error-text">{passwordErrors.current}</p>}
                </div>

                <div>
                  <label htmlFor="sec-next" className="field-label">Mật khẩu mới</label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                    <input
                      id="sec-next"
                      type="password"
                      value={passwords.next}
                      onChange={(event) => setPasswords((prev) => ({ ...prev, next: event.target.value }))}
                      autoComplete="new-password"
                      className={`field pl-11 ${passwordErrors.next ? "field-error" : ""}`}
                    />
                  </div>
                  {passwords.next && (
                    <div className="mt-2 flex gap-1">
                      {[0, 1, 2, 3].map((index) => (
                        <span
                          key={index}
                          className={`h-1 flex-1 rounded-full ${
                            index < passwordStrength
                              ? passwordStrength >= 3
                                ? "bg-emerald-500"
                                : "bg-amber-400"
                              : "bg-cream-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {passwordErrors.next && <p className="field-error-text">{passwordErrors.next}</p>}
                </div>

                <div>
                  <label htmlFor="sec-confirm" className="field-label">Xác nhận mật khẩu mới</label>
                  <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                    <input
                      id="sec-confirm"
                      type="password"
                      value={passwords.confirm}
                      onChange={(event) => setPasswords((prev) => ({ ...prev, confirm: event.target.value }))}
                      autoComplete="new-password"
                      className={`field pl-11 ${passwordErrors.confirm ? "field-error" : ""}`}
                    />
                  </div>
                  {passwordErrors.confirm && <p className="field-error-text">{passwordErrors.confirm}</p>}
                </div>

                <ul className="grid gap-2 rounded-xl bg-cream-100 p-4 text-[12px] text-ink-700 sm:grid-cols-2">
                  {[
                    { label: "Tối thiểu 8 ký tự", ok: passwords.next.length >= 8 },
                    { label: "Có chữ in hoa", ok: /[A-Z]/.test(passwords.next) },
                    { label: "Có chữ số", ok: /[0-9]/.test(passwords.next) },
                    { label: "Có ký tự đặc biệt", ok: /[^A-Za-z0-9]/.test(passwords.next) },
                  ].map((rule) => (
                    <li key={rule.label} className="flex items-center gap-2">
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full ${
                          rule.ok ? "bg-emerald-500 text-white" : "border border-cream-300 bg-white text-transparent"
                        }`}
                      >
                        <CheckIcon className="h-2.5 w-2.5" strokeWidth={4} />
                      </span>
                      {rule.label}
                    </li>
                  ))}
                </ul>

                <button type="submit" disabled={savingPassword} className="btn-primary px-7">
                  {savingPassword ? "Đang cập nhật…" : "Cập nhật mật khẩu"}
                </button>
              </form>

              <div className="mt-8 border-t border-cream-200 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-champagne-50 text-champagne-600">
                      <ShieldIcon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-950">Xác thực hai lớp (2FA)</p>
                      <p className="mt-0.5 text-[12px] text-ink-600/70">
                        Nhận mã OTP qua SMS mỗi khi đăng nhập trên thiết bị mới.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTwoFactor((value) => !value)}
                    aria-pressed={twoFactor}
                    aria-label="Bật/tắt xác thực hai lớp"
                    className={`relative h-7 w-12 rounded-full transition-colors ${
                      twoFactor ? "bg-emerald-500" : "bg-cream-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        twoFactor ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>
          )}

          {tab === "bookings" && (
            <section className="space-y-4">
              <header>
                <p className="eyebrow">Lịch sử giao dịch</p>
                <h1 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Đơn hàng & lịch hẹn</h1>
                <p className="mt-2 text-sm text-ink-600/75">
                  Theo dõi trạng thái đơn đặt cọc và lịch lái thử của bạn.
                </p>
              </header>

              {bookings.length === 0 && !loadingProfile && !errorMessage && (
                <div className="card p-8 text-center">
                  <p className="text-sm text-ink-600/70">
                    Bạn chưa có đơn đặt cọc hoặc lịch lái thử nào.
                  </p>
                  <Link href="/cars" className="btn-primary mt-4 inline-flex">
                    Khám phá xe
                  </Link>
                </div>
              )}

              {bookings.map((booking) => (
                <article key={`${booking.type}-${booking.id}`} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-champagne-600">
                        {booking.type === "Đặt cọc" ? <ShieldIcon className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                      </span>
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-ink-600/55">
                          {booking.type} · {booking.id}
                        </p>
                        <p className="font-display text-lg text-ink-950">{booking.car.name}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${booking.statusTone}`}>
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cream-200 pt-3 text-[12px] text-ink-600/70">
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <ClockIcon className="h-3.5 w-3.5 text-champagne-600" /> {booking.detail}
                      </span>
                      <span>Ngày tạo: {booking.date}</span>
                      {booking.type === "Đặt cọc" && <span>Giá trị xe: {formatVnd(booking.car.price)}</span>}
                    </div>
                    <Link
                      href={`/cars/${booking.car.slug}`}
                      className="font-medium text-ink-900 underline-offset-4 hover:text-champagne-600 hover:underline"
                    >
                      Xem chi tiết xe →
                    </Link>
                    {booking.canCancel && (
                      <button
                        type="button"
                        disabled={cancellingBookingId === booking.id}
                        onClick={() => void cancelTestDrive(booking)}
                        className="font-medium text-red-700 underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        {cancellingBookingId === booking.id ? "Đang hủy…" : "Hủy lịch hẹn"}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
