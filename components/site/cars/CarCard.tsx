import Link from "next/link";
import { formatShortVnd, formatVnd, type Car } from "@/lib/cars";
import { CarVisual } from "./CarVisual";
import { StarRating } from "@/components/ui/StarRating";
import { ArrowRightIcon, FuelIcon, GaugeIcon, SeatsIcon } from "@/components/ui/icons";

type CarCardProps = {
  car: Car;
  priority?: boolean;
};

export function CarCard({ car }: CarCardProps) {
  const soldOut = car.stock === 0;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-champagne-300 hover:shadow-luxe">
      <Link href={`/cars/${car.slug}`} className="absolute inset-0 z-20" aria-label={`Xem chi tiết ${car.name}`} />

      <div className="relative">
        <CarVisual car={car} variant="card" className="transition-transform duration-500 group-hover:scale-[1.02]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
          <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
            {car.modelYear} · {car.bodyType}
          </span>
          {soldOut ? (
            <span className="rounded-full bg-ink-950/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cream-100/80">
              Tạm hết hàng
            </span>
          ) : car.stock <= 5 ? (
            <span className="rounded-full bg-champagne-400 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-950">
              Còn {car.stock} xe
            </span>
          ) : null}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-4">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-cream-100/70">{car.brand}</span>
          <StarRating value={car.rating} size="sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[19px] leading-snug text-ink-950 transition-colors group-hover:text-champagne-600">
          {car.name}
        </h3>
        <p className="mt-1 line-clamp-1 text-[13px] text-ink-600/70">{car.tagline}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-cream-200 py-3 text-[12px] text-ink-700">
          <span className="inline-flex items-center gap-1.5">
            <FuelIcon className="h-4 w-4 text-champagne-500" /> {car.fuel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <SeatsIcon className="h-4 w-4 text-champagne-500" /> {car.seats} chỗ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <GaugeIcon className="h-4 w-4 text-champagne-500" /> {car.power} hp
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-600/50">Giá bán</p>
            <p className="font-display text-lg text-ink-950">{formatShortVnd(car.price)}</p>
            <p className="text-[11px] text-ink-600/55">{formatVnd(car.price)}</p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-300 text-ink-800 transition-all duration-300 group-hover:border-champagne-400 group-hover:bg-champagne-400 group-hover:text-ink-950">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
        </div>
      </div>
    </article>
  );
}
