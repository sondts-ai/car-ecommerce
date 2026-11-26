"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const COLUMNS = [
  {
    title: "Khám phá",
    links: [
      { href: "/cars", label: "Bộ sưu tập xe" },
      { href: "/cars?bodyType=SUV", label: "Xe SUV" },
      { href: "/cars?bodyType=Sedan", label: "Xe Sedan" },
      { href: "/cars?fuel=Điện", label: "Xe điện" },
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    links: [
      { href: "/cars", label: "Đặt lịch lái thử" },
      { href: "/profile", label: "Quản lý hồ sơ" },
      { href: "/profile#security", label: "Đổi mật khẩu" },
      { href: "/forgot-password", label: "Khôi phục mật khẩu" },
    ],
  },
];

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <footer className="mt-24 bg-ink-950 text-cream-100/70">
      <div className="container-luxe grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne-400/60">
              <span className="h-2 w-2 rounded-full bg-champagne-400" />
            </span>
            <span className="font-display text-[19px] tracking-[0.22em] text-cream-50">AUTOWEB</span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-100/55">
            Hệ thống kinh doanh ô tô cao cấp — nơi mỗi hành trình bắt đầu bằng một lựa chọn xứng tầm.
          </p>
          <div className="mt-6 space-y-1 text-sm text-cream-100/55">
            <p>Hotline: 1900 8686</p>
            <p>Email: hello@autoweb.vn</p>
          </div>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="font-display text-base text-cream-50">{column.title}</h3>
            <ul className="mt-5 space-y-3 text-sm">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-cream-100/60 transition hover:text-champagne-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="font-display text-base text-cream-50">Nhận báo giá mới nhất</h3>
          <p className="mt-4 text-sm text-cream-100/55">
            Đăng ký để nhận thông tin ưu đãi và các dòng xe mới ra mắt.
          </p>
          <form
            className="mt-5 flex overflow-hidden rounded-full border border-cream-100/20 bg-white/5"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              required
              placeholder="Email của bạn"
              aria-label="Email nhận bản tin"
              className="w-full bg-transparent px-4 py-2.5 text-sm text-cream-50 placeholder:text-cream-100/35 focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 bg-champagne-400 px-5 text-xs font-semibold uppercase tracking-wider text-ink-950 transition hover:bg-champagne-300"
            >
              Gửi
            </button>
          </form>
          <p className="mt-4 text-[11px] leading-relaxed text-cream-100/35">
            Bằng việc đăng ký, bạn đồng ý với chính sách bảo mật của AutoWeb.
          </p>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="container-luxe flex flex-col items-center justify-between gap-4 py-6 text-xs text-cream-100/40 sm:flex-row">
          <p>© {new Date().getFullYear()} AutoWeb Motors. Tất cả các quyền được bảo lưu.</p>
          <div className="flex items-center gap-6">
            <span>Điều khoản sử dụng</span>
            <span>Chính sách bảo mật</span>
            <span>Cookie</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
