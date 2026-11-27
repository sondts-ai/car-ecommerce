import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/layout/SiteHeader";
import { SiteFooter } from "@/components/site/layout/SiteFooter";

/** Layout cho toàn bộ khu khách hàng (route group `(user)` không đổi URL). */
export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
