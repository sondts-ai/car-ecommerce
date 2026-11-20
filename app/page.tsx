import Link from "next/link";
import { BODY_TYPES, CARS, FUEL_TYPES, formatShortVnd } from "@/lib/cars";
import { CarCard } from "@/components/cars/CarCard";
import { CarVisual } from "@/components/cars/CarVisual";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ChevronDownIcon,
  SearchIcon,
  ShieldIcon,
  SparkleIcon,
  ClockIcon,
} from "@/components/ui/icons";
import { StarRating } from "@/components/ui/StarRating";

const HERO_CAR = CARS[0];
const FEATURED = CARS.slice(0, 3);
const NEW_ARRIVALS = [CARS[3], CARS[7], CARS[4], CARS[5]];

const VALUE_PROPS = [
  {
    icon: ShieldIcon,
    title: "Xe chính hãng 100%",
    description: "Mỗi xe đều có hồ sơ nguồn gốc, kiểm định 172 điểm trước khi bàn giao.",
  },
  {
    icon: SparkleIcon,
    title: "Trải nghiệm đẳng cấp",
    description: "Showroom 5 sao, chuyên viên riêng đồng hành từ tư vấn đến sau bán hàng.",
  },
  {
    icon: ClockIcon,
    title: "Đặt cọc trong 3 phút",
    description: "Kiểm tra tồn kho thời gian thực và giữ xe ngay trên website, minh bạch từng bước.",
  },
  {
    icon: CalendarIcon,
    title: "Lái thử tận nơi",
    description: "Đặt lịch linh hoạt 14 ngày tới, xe được mang đến tận nhà theo yêu cầu.",
  },
];

const PROCESS = [
  { step: "01", title: "Khám phá & chọn xe", description: "Lọc theo hãng, ngân sách và nhu cầu sử dụng." },
  { step: "02", title: "Đặt lịch lái thử", description: "Trải nghiệm thực tế cùng chuyên viên tại showroom." },
  { step: "03", title: "Đặt cọc giữ xe", description: "Thanh toán trực tuyến an toàn, giữ xe 15 ngày." },
  { step: "04", title: "Nhận xe & hậu mãi", description: "Bàn giao tận nơi, bảo hành và hỗ trợ trọn đời." },
];

export default function HomePage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative overflow-hidden bg-ink-950 text-cream-50">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 20%, rgba(201,169,106,0.35), transparent 45%), radial-gradient(circle at 10% 80%, rgba(120,150,180,0.18), transparent 50%)",
          }}
        />
        <div className="container-luxe relative grid gap-12 pb-16 pt-14 lg:grid-cols-[1.02fr_1fr] lg:items-center lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest2 text-champagne-400">
              <span className="h-px w-10 bg-champagne-400/70" />
              Hệ thống kinh doanh ô tô
            </p>
            <h1 className="mt-6 text-balance font-display text-[42px] leading-[1.08] sm:text-6xl lg:text-[64px]">
              Hành trình đẳng cấp
              <span className="mt-2 block italic text-champagne-300">bắt đầu từ đây</span>
            </h1>
            <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-cream-100/70">
              Khám phá hơn 200 mẫu xe chính hãng từ những thương hiệu danh tiếng nhất thế giới. Đặt cọc
              trực tuyến, lái thử tận showroom — tất cả trong một trải nghiệm liền mạch.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/cars" className="btn-gold gap-2 px-7">
                Khám phá bộ sưu tập
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/cars?intent=test-drive" className="btn-ghost-light px-7">
                Đặt lịch lái thử
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-cream-100/12 pt-8">
              {[
                { value: "200+", label: "Mẫu xe" },
                { value: "18", label: "Showroom" },
                { value: "4.9/5", label: "Khách hàng hài lòng" },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="font-display text-2xl text-champagne-300 sm:text-3xl">{stat.value}</dt>
                  <dd className="mt-1 text-[11px] uppercase tracking-[0.14em] text-cream-100/50">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-up animate-delay-2">
            <div className="absolute -inset-6 rounded-[36px] border border-cream-100/10" aria-hidden />
            <div className="relative overflow-hidden rounded-[28px] border border-cream-100/15 shadow-luxe">
              <CarVisual car={HERO_CAR} variant="hero" />
              <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-4 bg-gradient-to-t from-ink-950 via-ink-950/70 to-transparent p-5 sm:p-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-champagne-300">Mẫu xe nổi bật</p>
                  <p className="mt-1 font-display text-xl sm:text-2xl">{HERO_CAR.name}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StarRating value={HERO_CAR.rating} size="sm" />
                    <span className="text-[11px] text-cream-100/60">{HERO_CAR.reviewCount} đánh giá</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-cream-100/50">Từ</p>
                  <p className="font-display text-xl text-champagne-300 sm:text-2xl">
                    {formatShortVnd(HERO_CAR.price)}
                  </p>
                  <Link
                    href={`/cars/${HERO_CAR.slug}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-cream-100/80 hover:text-champagne-300"
                  >
                    Xem chi tiết <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick search */}
        <div className="relative z-10 container-luxe pb-14">
          <form
            action="/cars"
            className="grid gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-luxe sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end lg:p-5"
          >
            <div>
              <label htmlFor="hero-q" className="field-label">
                Tìm kiếm
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/45" />
                <input
                  id="hero-q"
                  name="q"
                  placeholder="Tên xe, hãng xe…"
                  className="field h-11 rounded-full pl-11 text-sm"
                />
              </div>
            </div>
            <div>
              <label htmlFor="hero-body" className="field-label">
                Loại xe
              </label>
              <div className="relative">
                <select id="hero-body" name="bodyType" defaultValue="" className="field h-11 appearance-none rounded-full pr-9 text-sm">
                  <option value="">Tất cả loại xe</option>
                  {BODY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
              </div>
            </div>
            <div>
              <label htmlFor="hero-fuel" className="field-label">
                Nhiên liệu
              </label>
              <div className="relative">
                <select id="hero-fuel" name="fuel" defaultValue="" className="field h-11 appearance-none rounded-full pr-9 text-sm">
                  <option value="">Tất cả</option>
                  {FUEL_TYPES.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
              </div>
            </div>
            <button type="submit" className="btn-primary h-11 gap-2 rounded-full px-7 text-sm">
              <SearchIcon className="h-4 w-4" />
              Tìm xe
            </button>
          </form>
        </div>
      </section>

      {/* ================= FEATURED ================= */}
      <section className="container-luxe py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bộ sưu tập</p>
            <h2 className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">Mẫu xe được yêu thích</h2>
            <p className="mt-2 max-w-xl text-sm text-ink-600/75">
              Những lựa chọn hàng đầu được khách hàng AutoWeb tin tưởng trong năm nay.
            </p>
          </div>
          <Link href="/cars" className="group inline-flex items-center gap-2 text-sm font-medium text-ink-900">
            Xem tất cả xe
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-300 transition group-hover:border-champagne-400 group-hover:bg-champagne-400">
              <ArrowRightIcon className="h-4 w-4" />
            </span>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </section>

      {/* ================= VALUE PROPS ================= */}
      <section id="ve-chung-toi" className="bg-cream-100 py-16 lg:py-20">
        <div className="container-luxe">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Vì sao chọn AutoWeb</p>
            <h2 className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">
              Chuẩn mực mới của dịch vụ ô tô
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-600/75">
              Chúng tôi không chỉ bán xe — chúng tôi kiến tạo trải nghiệm sở hữu xe trọn vẹn và minh bạch.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPS.map((item) => (
              <div
                key={item.title}
                className="group rounded-2xl border border-cream-200 bg-white p-6 transition hover:-translate-y-1 hover:border-champagne-300 hover:shadow-luxe"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne-50 text-champagne-600 transition group-hover:bg-champagne-400 group-hover:text-ink-950">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-lg text-ink-950">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-600/75">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= NEW ARRIVALS ================= */}
      <section className="container-luxe py-16 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Mới về showroom</p>
            <h2 className="mt-3 font-display text-3xl text-ink-950 sm:text-4xl">Vừa cập bến AutoWeb</h2>
          </div>
          <Link href="/cars?sort=featured" className="link-underline text-sm font-medium text-ink-900">
            Xem toàn bộ
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {NEW_ARRIVALS.map((car) => (
            <Link
              key={car.id}
              href={`/cars/${car.slug}`}
              className="group flex items-stretch overflow-hidden rounded-2xl border border-cream-200 bg-white transition hover:border-champagne-300 hover:shadow-luxe"
            >
              <div className="w-[42%] shrink-0 overflow-hidden">
                <CarVisual car={car} variant="thumb" className="h-full w-full" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-champagne-600">{car.brand}</p>
                  <h3 className="mt-1 font-display text-lg leading-snug text-ink-950">{car.name}</h3>
                  <p className="mt-1 text-[12px] text-ink-600/65">
                    {car.fuel} · {car.seats} chỗ · {car.power} hp
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-display text-base text-ink-950">{formatShortVnd(car.price)}</p>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-cream-300 text-ink-800 transition group-hover:border-champagne-400 group-hover:bg-champagne-400">
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ================= PROCESS ================= */}
      <section className="bg-ink-950 py-16 text-cream-50 lg:py-20">
        <div className="container-luxe">
          <div className="max-w-xl">
            <p className="eyebrow">Quy trình 4 bước</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">Sở hữu xe chỉ trong một tuần</h2>
          </div>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map((item) => (
              <li key={item.step} className="relative rounded-2xl border border-cream-100/12 bg-white/[0.03] p-6">
                <span className="font-display text-3xl text-champagne-400/60">{item.step}</span>
                <h3 className="mt-3 font-display text-lg">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-100/60">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="container-luxe py-16 lg:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#171B20] via-[#101318] to-[#0A0C0F] px-6 py-12 text-cream-50 sm:px-12 lg:py-16">
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: "radial-gradient(circle, #C9A96A 0%, transparent 70%)" }}
          />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Trải nghiệm miễn phí</p>
              <h2 className="mt-3 text-balance font-display text-3xl sm:text-4xl">
                Đặt lịch lái thử mẫu xe bạn yêu thích
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-cream-100/65">
                Chỉ 30 phút để cảm nhận sự khác biệt. Chuyên viên AutoWeb sẽ chuẩn bị xe và đón bạn tại
                showroom gần nhất.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Miễn phí 100%", "Không cần đặt cọc", "Đổi lịch linh hoạt"].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full border border-cream-100/20 px-3 py-1.5 text-[11px] text-cream-100/75"
                  >
                    <CheckIcon className="h-3 w-3 text-champagne-400" strokeWidth={3} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/cars?intent=test-drive" className="btn-gold w-full gap-2">
                Đặt lịch lái thử
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/cars" className="btn-ghost-light w-full">
                Xem bộ sưu tập xe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
