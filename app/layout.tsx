import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AutoWeb — Hệ thống kinh doanh ô tô",
    template: "%s | AutoWeb",
  },
  description:
    "Khám phá, đặt cọc và đặt lịch lái thử các mẫu xe sang trọng tại AutoWeb — cổng khách hàng của hệ thống kinh doanh ô tô.",
  keywords: ["ô tô", "mua xe", "đặt cọc xe", "lái thử", "showroom", "AutoWeb"],
};

/**
 * Root layout dùng chung cho toàn bộ ứng dụng (user + admin).
 * Chỉ chứa <html>/<body>/font và metadata — không chứa header/footer.
 *
 * - Khu khách hàng: `app/(user)/layout.tsx` bọc SiteHeader + SiteFooter.
 * - Khu quản trị:   `app/admin/layout.tsx` bọc AdminGuard + AdminShell.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
