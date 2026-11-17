import type { Metadata } from "next";
import Link from "next/link";
import { BODY_TYPES, CARS, FUEL_TYPES, type BodyType, type FuelType } from "@/lib/cars";
import { CarListView } from "@/components/cars/CarListView";
import { ArrowRightIcon, CalendarIcon, CheckIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Bộ sưu tập xe",
  description:
    "Khám phá và tìm kiếm hơn 200 mẫu xe chính hãng tại AutoWeb: SUV, Sedan, Crossover, bán tải và xe điện với bộ lọc theo hãng, giá và loại xe.",
};

type CarsSearchParams = {
  q?: string;
  brand?: string;
  bodyType?: string;
  fuel?: string;
  sort?: string;
  intent?: string;
};

const SORTS = ["featured", "price-asc", "price-desc", "rating"] as const;

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<CarsSearchParams>;
}) {
  const params = await searchParams;

  const bodyType = BODY_TYPES.includes(params.bodyType as BodyType)
    ? (params.bodyType as BodyType)
    : undefined;
  const fuel = FUEL_TYPES.includes(params.fuel as FuelType) ? (params.fuel as FuelType) : undefined;
  const brand = CARS.some((car) => car.brand === params.brand) ? params.brand : undefined;
  const sort = SORTS.includes(params.sort as (typeof SORTS)[number])
    ? (params.sort as (typeof SORTS)[number])
    : "featured";

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 pb-12 pt-12 text-cream-50 sm:pb-14 sm:pt-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 85% 10%, rgba(201,169,106,0.35), transparent 48%)",
          }}
        />
        <div className="container-luxe relative">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] text-cream-100/50">
            <Link href="/" className="hover:text-champagne-300">
              Trang chủ
            </Link>
            <span aria-hidden>/</span>
            <span className="text-cream-100/80">Bộ sưu tập xe</span>
          </nav>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="eyebrow">Bộ sưu tập 2026</p>
              <h1 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
                Tìm chiếc xe dành riêng cho bạn
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream-100/65">
                Hơn 200 mẫu xe chính hãng, sẵn sàng giao trong 7–14 ngày. Sử dụng bộ lọc để thu hẹp lựa chọn
                theo nhu cầu và ngân sách của bạn.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] text-cream-100/60">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-champagne-400" strokeWidth={3} /> Kiểm định 172 điểm
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-champagne-400" strokeWidth={3} /> Bảo hành chính hãng
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-champagne-400" strokeWidth={3} /> Hỗ trợ trả góp 6,9%
              </span>
            </div>
          </div>
        </div>
      </section>

      {params.intent === "test-drive" && (
        <div className="container-luxe pt-6">
          <div className="flex items-start gap-3 rounded-2xl border border-champagne-300 bg-champagne-50 px-5 py-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-champagne-400/20 text-champagne-600">
              <CalendarIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-950">Chọn mẫu xe bạn muốn lái thử</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-ink-600/75">
                Mở trang chi tiết xe và nhấn “Đặt lịch lái thử” — miễn phí, đổi lịch linh hoạt trước 6 giờ.
              </p>
            </div>
          </div>
        </div>
      )}

      <CarListView
        cars={CARS}
        initialFilters={{
          query: params.q ?? "",
          brands: brand ? [brand] : [],
          bodyTypes: bodyType ? [bodyType] : [],
          fuels: fuel ? [fuel] : [],
          priceRange: null,
          sort,
        }}
      />

      <section className="container-luxe pb-16">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-cream-200 bg-white p-6 sm:flex-row sm:p-8">
          <div>
            <h2 className="font-display text-xl text-ink-950">Chưa tìm được mẫu xe ưng ý?</h2>
            <p className="mt-1 text-sm text-ink-600/70">
              Để lại nhu cầu, chuyên viên AutoWeb sẽ tư vấn cấu hình và báo giá riêng cho bạn.
            </p>
          </div>
          <Link href="/cars?intent=test-drive" className="btn-primary shrink-0 gap-2">
            Nhận tư vấn miễn phí
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
