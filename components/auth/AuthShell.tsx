import Link from "next/link";
import { CheckIcon, ShieldIcon } from "@/components/ui/icons";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  sideHeading?: string;
  sideDescription?: string;
  benefits?: string[];
  footer?: React.ReactNode;
};

const DEFAULT_BENEFITS = [
  "Theo dõi đơn đặt cọc và lịch lái thử mọi lúc",
  "Nhận báo giá và ưu đãi dành riêng cho thành viên",
  "Lưu mẫu xe yêu thích, so sánh cấu hình dễ dàng",
  "Hỗ trợ trực tuyến 24/7 từ chuyên viên AutoWeb",
];

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  sideHeading = "Một tài khoản, trọn vẹn hành trình",
  sideDescription = "Quản lý đơn hàng, lịch hẹn và ưu đãi cá nhân hoá trong cùng một nơi.",
  benefits = DEFAULT_BENEFITS,
  footer,
}: AuthShellProps) {
  return (
    <div className="container-luxe py-10 lg:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-luxe lg:grid-cols-[1.05fr_1fr]">
        {/* Panel thương hiệu */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-ink-950 p-10 text-cream-50 lg:flex xl:p-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 15%, rgba(201,169,106,0.35), transparent 45%), radial-gradient(circle at 80% 85%, rgba(110,150,190,0.2), transparent 45%)",
            }}
          />
          <div className="relative">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-champagne-400/60">
                <span className="h-2 w-2 rounded-full bg-champagne-400" />
              </span>
              <span className="font-display text-[19px] tracking-[0.22em]">AUTOWEB</span>
            </Link>

            <h2 className="mt-16 max-w-sm font-display text-[34px] leading-tight xl:text-[38px]">
              {sideHeading}
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-100/60">{sideDescription}</p>

            <ul className="mt-8 space-y-3">
              {benefits.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] text-cream-100/75">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne-400/15 text-champagne-300">
                    <CheckIcon className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mt-12 flex items-center gap-3 rounded-xl border border-cream-100/12 bg-white/[0.03] p-4">
            <ShieldIcon className="h-8 w-8 shrink-0 text-champagne-400" />
            <p className="text-[11px] leading-relaxed text-cream-100/55">
              Thông tin của bạn được mã hoá và bảo vệ theo tiêu chuẩn ISO 27001. AutoWeb không chia sẻ dữ
              liệu cho bên thứ ba.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 sm:p-10 xl:p-12">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-[28px] leading-tight text-ink-950 sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-600/75">{subtitle}</p>

          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 border-t border-cream-200 pt-5">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
