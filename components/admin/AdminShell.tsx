"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { API_CONFIG, authApi, type AuthUser } from "@/lib/api";

const ADMIN_NAV = [
  { href: "/admin", label: "Tổng quan & Thống kê", exact: true },
  { href: "/admin/brands", label: "Hãng xe", exact: false },
  { href: "/admin/categories", label: "Phân loại xe", exact: false },
  { href: "/admin/car-models", label: "Dòng xe & Phiên bản", exact: false },
  { href: "/admin/vehicles", label: "Kho xe cụ thể", exact: false },
  { href: "/admin/orders", label: "Đơn đặt cọc", exact: false },
  { href: "/admin/test-drives", label: "Lịch lái thử", exact: false },
  { href: "/admin/branches", label: "Chi nhánh showroom", exact: false },
];

export function AdminShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await authApi.logout();
    router.replace("/admin/login");
  };

  return (
    <div className="flex min-h-screen bg-cream-50 text-ink-900">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-800 bg-ink-950 text-cream-100 lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-cream-100/10 px-6">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-champagne-400/70">
            <span className="h-2 w-2 rounded-full bg-champagne-400" />
          </span>
          <div className="leading-none">
            <p className="font-display text-base tracking-[0.2em] text-cream-50">AUTOWEB</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-champagne-400">
              Admin Portal
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-cream-100/40">
            Quản trị hệ thống
          </p>
          {ADMIN_NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition ${
                  active
                    ? "bg-champagne-400 text-ink-950 font-semibold"
                    : "text-cream-100/75 hover:bg-white/5 hover:text-cream-50"
                }`}
              >
                <span>{item.label}</span>
                {active && <span className="h-1.5 w-1.5 rounded-full bg-ink-950" />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-cream-100/10 p-4 text-xs">
          <div className="rounded-xl border border-cream-100/10 bg-white/[0.03] p-3">
            <p className="truncate font-semibold text-cream-50">{user.email}</p>
            <p className="mt-0.5 text-[11px] text-champagne-300">Vai trò: {user.role ?? "ADMIN"}</p>
          </div>
          <div className="mt-3 flex gap-2">
            <Link
              href="/"
              className="flex-1 rounded-lg border border-cream-100/20 py-2 text-center text-[11px] font-medium text-cream-100/80 transition hover:border-champagne-400/60 hover:text-champagne-300"
            >
              Trang khách
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-lg border border-red-400/30 bg-red-500/10 py-2 text-[11px] font-medium text-red-200 transition hover:bg-red-500/20"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-ink-950/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative z-10 flex w-64 flex-col bg-ink-950 text-cream-100">
            <div className="flex h-16 items-center justify-between border-b border-cream-100/10 px-5">
              <span className="font-display text-base tracking-[0.2em] text-cream-50">AUTOWEB ADMIN</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="text-xs text-cream-100/70"
              >
                Đóng
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {ADMIN_NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`block rounded-xl px-3.5 py-2.5 text-[13px] font-medium ${
                      active
                        ? "bg-champagne-400 text-ink-950 font-semibold"
                        : "text-cream-100/75 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-cream-100/10 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg border border-red-400/30 bg-red-500/10 py-2 text-xs text-red-200"
              >
                Đăng xuất ({user.email})
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[64px] items-center justify-between gap-4 border-b border-cream-200 bg-white/90 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-semibold text-ink-800 lg:hidden"
            >
              Menu
            </button>
            <span className="text-xs font-medium text-ink-600">
              Hệ thống quản trị kinh doanh ô tô
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${
                API_CONFIG.useBackendServices
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                  : "border-champagne-400/50 bg-champagne-50 text-champagne-600"
              }`}
            >
              {API_CONFIG.useBackendServices ? "Backend Spring Boot" : "Chế độ Mock Local"}
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1320px] flex-1 p-5 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
