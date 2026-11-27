import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARS, formatShortVnd, formatVnd, getCarBySlug, getRelatedCars } from "@/lib/cars";
import { CarVisual } from "@/components/site/cars/CarVisual";
import { CarCard } from "@/components/site/cars/CarCard";
import { ReviewSection } from "@/components/site/cars/ReviewSection";
import { StarRating } from "@/components/ui/StarRating";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  FuelIcon,
  GaugeIcon,
  GearIcon,
  PhoneIcon,
  SeatsIcon,
  ShieldIcon,
} from "@/components/ui/icons";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return CARS.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) return { title: "Không tìm thấy xe" };
  return {
    title: car.name,
    description: `${car.tagline}. Giá từ ${formatShortVnd(car.price)} tại AutoWeb — đặt cọc trực tuyến, đặt lịch lái thử miễn phí.`,
  };
}

export default async function CarDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) notFound();

  const related = getRelatedCars(car);
  const soldOut = car.stock === 0;
  const monthlyEstimate = Math.round((car.price * 0.7 * (0.069 / 12)) / (1 - Math.pow(1 + 0.069 / 12, -84)));

  const keySpecs = [
    { icon: FuelIcon, label: "Nhiên liệu", value: car.fuel },
    { icon: GaugeIcon, label: "Công suất", value: `${car.power} hp` },
    { icon: SeatsIcon, label: "Số chỗ", value: `${car.seats} chỗ` },
    { icon: GearIcon, label: "Hộp số", value: car.transmission },
  ];

  return (
    <>
      {/* Breadcrumb */}
      <div className="border-b border-cream-200 bg-white/70">
        <div className="container-luxe flex items-center gap-2 py-4 text-[11px] text-ink-600/60">
          <Link href="/" className="hover:text-ink-950">
            Trang chủ
          </Link>
          <span aria-hidden>/</span>
          <Link href="/cars" className="hover:text-ink-950">
            Bộ sưu tập xe
          </Link>
          <span aria-hidden>/</span>
          <span className="truncate text-ink-900">{car.name}</span>
        </div>
      </div>

      <div className="container-luxe py-8 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {/* ============ LEFT ============ */}
          <div className="min-w-0 space-y-10">
            {/* Tiêu đề */}
            <header>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-champagne-300 bg-champagne-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-champagne-600">
                  {car.brand}
                </span>
                <span className="chip text-[10px] uppercase tracking-wider">{car.bodyType}</span>
                <span className="chip text-[10px] uppercase tracking-wider">Đời {car.modelYear}</span>
                {soldOut ? (
                  <span className="chip border-amber-300 bg-amber-50 text-[10px] uppercase tracking-wider text-amber-700">
                    Tạm hết hàng
                  </span>
                ) : (
                  <span className="chip border-emerald-500/30 bg-emerald-500/[0.07] text-[10px] uppercase tracking-wider text-emerald-600">
                    Còn {car.stock} xe
                  </span>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl leading-tight text-ink-950 sm:text-[42px]">
                {car.name}
              </h1>
              <p className="mt-2 text-[15px] text-ink-600/80">{car.tagline}</p>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <StarRating value={car.rating} size="sm" showValue />
                  <Link href="#danh-gia" className="text-[12px] text-ink-600/60 underline-offset-4 hover:underline">
                    {car.reviewCount} đánh giá
                  </Link>
                </div>
                <span className="h-3 w-px bg-cream-300" />
                <span className="text-[12px] text-ink-600/60">Mã xe: {car.id.toUpperCase()}</span>
              </div>
            </header>

            {/* Gallery */}
            <div>
              <CarVisual car={car} variant="hero" className="rounded-2xl shadow-luxe">
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cream-100/60">AutoWeb Studio</p>
                    <p className="mt-1 font-display text-lg text-cream-50">{car.name}</p>
                  </div>
                  <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] text-cream-50 backdrop-blur">
                    Ảnh minh hoạ 360°
                  </span>
                </div>
              </CarVisual>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cream-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-ink-600/60">Màu ngoại thất</span>
                  <div className="flex items-center gap-1.5">
                    {["#0B0D10", "#EDEDED", "#C9A96A", "#3B4B5A", "#6B1F25"].map((color) => (
                      <span
                        key={color}
                        className="h-5 w-5 rounded-full border border-black/10 ring-1 ring-transparent transition hover:ring-champagne-400"
                        style={{ backgroundColor: color }}
                        title="Xem màu"
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-ink-600/60">+3 màu khác</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-600/60">
                  <ClockIcon className="h-3.5 w-3.5 text-champagne-600" /> Giao xe 7–14 ngày
                </span>
              </div>
            </div>

            {/* Thông số nhanh */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {keySpecs.map((spec) => (
                <div key={spec.label} className="rounded-xl border border-cream-200 bg-white p-4">
                  <spec.icon className="h-5 w-5 text-champagne-500" />
                  <p className="mt-3 text-[10px] uppercase tracking-wider text-ink-600/55">{spec.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink-950">{spec.value}</p>
                </div>
              ))}
            </div>

            {/* Mô tả */}
            <section>
              <p className="eyebrow">Giới thiệu</p>
              <h2 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Về mẫu xe này</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-700/85">{car.description}</p>

              <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
                {car.highlights.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[13px] text-ink-800">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-champagne-50 text-champagne-600">
                      <CheckIcon className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* Bảng thông số */}
            <section>
              <p className="eyebrow">Thông số kỹ thuật</p>
              <h2 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Cấu hình chi tiết</h2>
              <div className="mt-4 overflow-hidden rounded-2xl border border-cream-200 bg-white">
                <dl>
                  {car.specs.map((spec, index) => (
                    <div
                      key={spec.label}
                      className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm ${
                        index !== car.specs.length - 1 ? "border-b border-cream-200" : ""
                      } ${index % 2 === 0 ? "bg-white" : "bg-cream-50"}`}
                    >
                      <dt className="text-ink-600/75">{spec.label}</dt>
                      <dd className="font-medium text-ink-950">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="mt-3 text-[11px] text-ink-600/50">
                * Thông số có thể thay đổi theo từng lô xe. Vui lòng liên hệ showroom để xác nhận cấu hình
                thực tế.
              </p>
            </section>

            <ReviewSection car={car} />
          </div>

          {/* ============ RIGHT: Sticky booking card ============ */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-luxe">
              <div className="border-b border-cream-200 p-5">
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink-600/55">Giá bán lẻ đề xuất</p>
                <div className="mt-1 flex flex-wrap items-end gap-2">
                  <p className="font-display text-3xl text-ink-950">{formatVnd(car.price)}</p>
                  {car.originalPrice && (
                    <p className="text-sm text-ink-600/50 line-through">{formatShortVnd(car.originalPrice)}</p>
                  )}
                </div>
                {car.originalPrice && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                    Tiết kiệm {formatShortVnd(car.originalPrice - car.price)}
                  </p>
                )}
                <p className="mt-3 text-[11px] leading-relaxed text-ink-600/65">
                  Trả góp từ <span className="font-semibold text-ink-900">{formatVnd(monthlyEstimate)}/tháng</span>{" "}
                  · Lãi suất 6,9%/năm · Vay tới 70% giá trị xe
                </p>
              </div>

              <div className="space-y-3 p-5">
                <div className="rounded-xl bg-cream-100 p-3.5 text-[11px] leading-relaxed text-ink-700">
                  <p className="flex items-center justify-between">
                    <span>Đặt cọc giữ xe từ</span>
                    <span className="font-semibold text-ink-950">20.000.000 ₫</span>
                  </p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-ink-600/70">
                    <ShieldIcon className="h-3.5 w-3.5 text-champagne-600" /> Hoàn cọc 100% trong 48 giờ
                  </p>
                </div>

                <Link
                  href={`/cars/${car.slug}/deposit`}
                  aria-disabled={soldOut}
                  className={`btn-primary w-full gap-2 ${soldOut ? "pointer-events-none opacity-50" : ""}`}
                >
                  Đặt cọc xe
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
                <Link href={`/cars/${car.slug}/test-drive`} className="btn-outline w-full gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Đặt lịch lái thử
                </Link>

                <a
                  href="tel:19008686"
                  className="flex items-center justify-center gap-2 py-1.5 text-[13px] font-medium text-ink-800 hover:text-champagne-600"
                >
                  <PhoneIcon className="h-4 w-4" /> 1900 8686 — Tư vấn ngay
                </a>

                <div className="divider-gold" />

                <ul className="space-y-2 text-[11px] leading-relaxed text-ink-600/70">
                  <li className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                    Giá đã bao gồm VAT, không phát sinh phí ẩn
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                    Hỗ trợ đăng ký, đăng kiểm, biển số trọn gói
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />
                    Bảo hành chính hãng 5 năm hoặc 150.000 km
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-cream-300 py-3 text-[11px] text-ink-600/60">
              <ShieldIcon className="h-3.5 w-3.5 text-champagne-600" /> Giao dịch được bảo mật bởi AutoWeb Pay
            </div>
          </aside>
        </div>
      </div>

      {/* Xe liên quan */}
      <section className="container-luxe pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Có thể bạn quan tâm</p>
            <h2 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">Mẫu xe tương tự</h2>
          </div>
          <Link href="/cars" className="link-underline text-sm font-medium text-ink-900">
            Xem tất cả
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((item) => (
            <CarCard key={item.id} car={item} />
          ))}
        </div>
      </section>
    </>
  );
}
