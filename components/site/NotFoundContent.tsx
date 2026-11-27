import Link from "next/link";

/** Nội dung 404 dùng chung cho 404 toàn cục và 404 trong khu khách hàng. */
export function NotFoundContent() {
  return (
    <section className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="eyebrow">Lỗi 404</p>
      <h1 className="mt-3 font-display text-5xl text-ink-950">Không tìm thấy trang</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-600/75">
        Đường dẫn bạn truy cập có thể đã thay đổi hoặc mẫu xe không còn trong bộ sưu tập. Hãy quay lại để
        tiếp tục khám phá.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary px-7">
          Về trang chủ
        </Link>
        <Link href="/cars" className="btn-outline px-7">
          Xem bộ sưu tập xe
        </Link>
      </div>
    </section>
  );
}
