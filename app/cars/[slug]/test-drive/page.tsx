import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CARS, getCarBySlug } from "@/lib/cars";
import { TestDriveForm } from "@/components/booking/TestDriveForm";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return CARS.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  return { title: car ? `Lái thử ${car.name}` : "Đặt lịch lái thử" };
}

export default async function TestDrivePage({ params }: PageProps) {
  const { slug } = await params;
  const car = getCarBySlug(slug);
  if (!car) notFound();

  return (
    <>
      <div className="border-b border-cream-200 bg-white/70">
        <div className="container-luxe flex items-center gap-2 py-4 text-[11px] text-ink-600/60">
          <Link href="/cars" className="hover:text-ink-950">
            Bộ sưu tập xe
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/cars/${car.slug}`} className="hover:text-ink-950">
            {car.name}
          </Link>
          <span aria-hidden>/</span>
          <span className="text-ink-900">Đặt lịch lái thử</span>
        </div>
      </div>

      <TestDriveForm cars={CARS} initialCarSlug={car.slug} />
    </>
  );
}
