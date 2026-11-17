import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: {
    default: "AutoWeb — Hệ thống kinh doanh ô tô",
    template: "%s | AutoWeb",
  },
  description:
    "Khám phá, đặt cọc và đặt lịch lái thử các mẫu xe sang trọng tại AutoWeb — cổng khách hàng của hệ thống kinh doanh ô tô.",
  keywords: ["ô tô", "mua xe", "đặt cọc xe", "lái thử", "showroom", "AutoWeb"],
};

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
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
