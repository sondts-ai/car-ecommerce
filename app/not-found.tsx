import { SiteHeader } from "@/components/site/layout/SiteHeader";
import { SiteFooter } from "@/components/site/layout/SiteFooter";
import { NotFoundContent } from "@/components/site/NotFoundContent";

/**
 * 404 toàn cục cho URL không khớp route nào. Vì nằm ngoài route group `(user)`
 * nên cần tự bọc header/footer; 404 phát sinh trong khu khách hàng dùng
 * `app/(user)/not-found.tsx` (đã có layout sẵn).
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <NotFoundContent />
      </main>
      <SiteFooter />
    </div>
  );
}
