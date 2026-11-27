"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authApi, clearTokens, hasSession, onAuthChange, type AuthUser } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ" },
  { href: "/cars", label: "Bộ sưu tập xe" },
  { href: "/cars?intent=test-drive", label: "Lái thử" },
  { href: "/profile", label: "Tài khoản" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Đồng bộ trạng thái đăng nhập (kể cả khi login/logout ở trang khác).
  useEffect(() => {
    let active = true;

    async function syncUser() {
      if (!hasSession()) {
        if (active) {
          setUser(null);
          setAuthReady(true);
        }
        return;
      }
      try {
        const me = await authApi.me();
        if (active) setUser(me);
      } catch {
        clearTokens();
        if (active) setUser(null);
      } finally {
        if (active) setAuthReady(true);
      }
    }

    void syncUser();
    const unsubscribe = onAuthChange(() => void syncUser());
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setLoggingOut(false);
      setOpen(false);
      router.replace("/");
      router.refresh();
    }
  };

  const displayName = user?.fullName && user.fullName !== user.email ? user.fullName : user?.email;
  const initial = (displayName ?? "?").trim().charAt(0).toUpperCase();

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-champagne-400/15 bg-ink-950/95 backdrop-blur-md"
          : "border-transparent bg-ink-950"
      }`}
    >
      <div className="container-luxe flex h-[72px] items-center justify-between gap-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="AutoWeb — Trang chủ">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-champagne-400/60">
            <span className="h-2 w-2 rounded-full bg-champagne-400 transition-transform duration-300 group-hover:scale-150" />
            <span className="absolute inset-0 rounded-full border border-champagne-400/20" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-[19px] tracking-[0.22em] text-cream-50">AUTOWEB</span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.3em] text-champagne-400/80">
              Automotive
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`link-underline text-[13px] font-medium tracking-wide transition-colors ${
                  active ? "text-champagne-300" : "text-cream-100/75 hover:text-cream-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {!authReady ? (
            <span className="h-9 w-24 animate-pulse rounded-full bg-white/5" aria-hidden />
          ) : user ? (
            <>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-full border border-champagne-400/50 px-4 py-2 text-[12px] font-semibold text-champagne-300 transition hover:bg-champagne-400 hover:text-ink-950"
                >
                  Quản trị
                </Link>
              )}
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-cream-100/20 py-1.5 pl-1.5 pr-3.5 text-[12px] font-medium text-cream-50 transition hover:border-champagne-400/60"
                title={user.email}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-champagne-400 text-[12px] font-bold text-ink-950">
                  {initial}
                </span>
                <span className="max-w-[120px] truncate">{displayName}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-full px-3 py-2 text-[12px] font-medium text-cream-100/60 transition hover:text-red-300 disabled:opacity-50"
              >
                {loggingOut ? "Đang thoát…" : "Đăng xuất"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-cream-100/20 px-5 py-2.5 text-[13px] font-medium text-cream-50 transition hover:border-champagne-400/60 hover:text-champagne-300"
            >
              Đăng nhập
            </Link>
          )}
          <Link
            href="/cars"
            className="rounded-full bg-champagne-400 px-5 py-2.5 text-[13px] font-semibold text-ink-950 transition hover:bg-champagne-300"
          >
            Đặt lịch lái thử
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Mở menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/20 text-cream-50 lg:hidden"
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-px w-full bg-current transition-all ${
                open ? "top-1.5 rotate-45" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-px w-full bg-current transition-all ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 top-3 h-px w-full bg-current transition-all ${
                open ? "top-1.5 -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open && (
        <div className="border-t border-cream-100/10 bg-ink-950 lg:hidden">
          <nav className="container-luxe flex flex-col py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b border-cream-100/5 py-3.5 text-sm text-cream-100/85"
              >
                {item.label}
              </Link>
            ))}

            {user ? (
              <div className="space-y-3 py-4">
                <div className="flex items-center gap-3 rounded-xl border border-cream-100/10 bg-white/[0.03] px-3 py-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-champagne-400 text-sm font-bold text-ink-950">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-cream-50">{displayName}</p>
                    <p className="text-[11px] text-champagne-300">Vai trò: {user.role ?? "CUSTOMER"}</p>
                  </div>
                </div>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="btn-gold block py-2.5 text-center text-[13px]">
                    Vào trang quản trị
                  </Link>
                )}
                <div className="flex gap-3">
                  <Link href="/profile" className="btn-ghost-light flex-1 py-2.5 text-[13px]">
                    Tài khoản
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex-1 rounded-full border border-red-400/30 bg-red-500/10 py-2.5 text-[13px] font-medium text-red-200 disabled:opacity-50"
                  >
                    {loggingOut ? "Đang thoát…" : "Đăng xuất"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 py-4">
                <Link href="/login" className="btn-ghost-light flex-1 py-2.5 text-[13px]">
                  Đăng nhập
                </Link>
                <Link href="/register" className="btn-gold flex-1 py-2.5 text-[13px]">
                  Đăng ký
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
