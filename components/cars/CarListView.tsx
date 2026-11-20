"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  BODY_TYPES,
  BRANDS,
  EMPTY_FILTERS,
  FUEL_TYPES,
  PRICE_RANGES,
  filterCars,
  type BodyType,
  type Car,
  type CarFilters,
  type FuelType,
} from "@/lib/cars";
import { CarCard } from "./CarCard";
import { CheckIcon, SearchIcon, SlidersIcon, XIcon } from "@/components/ui/icons";

type CarListViewProps = {
  cars: Car[];
  initialFilters?: Partial<CarFilters>;
  pageSize?: number;
};

const SORT_OPTIONS: { value: CarFilters["sort"]; label: string }[] = [
  { value: "featured", label: "Phổ biến nhất" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
  { value: "rating", label: "Đánh giá cao" },
];

function toggleItem<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function CarListView({ cars, initialFilters, pageSize = 6 }: CarListViewProps) {
  const [filters, setFilters] = useState<CarFilters>({ ...EMPTY_FILTERS, ...initialFilters });
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const deferredQuery = useDeferredValue(filters.query);
  const isFirstRender = useRef(true);
  const isPendingSearch = deferredQuery !== filters.query;

  const results = useMemo(
    () => filterCars(cars, { ...filters, query: deferredQuery }),
    [cars, filters, deferredQuery],
  );

  const activeCount =
    filters.brands.length +
    filters.bodyTypes.length +
    filters.fuels.length +
    (filters.priceRange ? 1 : 0);

  /** Hiệu ứng skeleton ngắn khi thay đổi bộ lọc — thay bằng `isFetching` khi nối API thật. */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsLoading(true);
    setVisibleCount(pageSize);
    const timer = setTimeout(() => setIsLoading(false), 320);
    return () => clearTimeout(timer);
  }, [
    deferredQuery,
    filters.brands,
    filters.bodyTypes,
    filters.fuels,
    filters.priceRange,
    filters.sort,
    pageSize,
  ]);

  // Khoá scroll nền khi mở drawer bộ lọc trên mobile
  useEffect(() => {
    document.body.style.overflow = filtersOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [filtersOpen]);

  const update = <K extends keyof CarFilters>(key: K, value: CarFilters[K]) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const clearAll = () => setFilters({ ...EMPTY_FILTERS, sort: filters.sort });

  const showSkeleton = isLoading || isPendingSearch;
  const visibleCars = results.slice(0, visibleCount);

  return (
    <section aria-label="Danh sách xe" className="container-luxe py-10 lg:py-14">
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* ============ Sidebar bộ lọc (desktop) ============ */}
        <aside className="hidden w-[268px] shrink-0 lg:block">
          <div className="sticky top-24 rounded-2xl border border-cream-200 bg-white p-6 shadow-card">
            <FilterPanel
              filters={filters}
              activeCount={activeCount}
              onChange={update}
              onClear={clearAll}
            />
          </div>
        </aside>

        {/* ============ Nội dung chính ============ */}
        <div className="min-w-0 flex-1">
          {/* Thanh tìm kiếm */}
          <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-600/45" />
                <input
                  type="search"
                  value={filters.query}
                  onChange={(event) => update("query", event.target.value)}
                  placeholder="Tìm theo hãng, mẫu xe, loại xe…"
                  aria-label="Tìm kiếm xe"
                  className="field h-12 w-full rounded-full pl-12 pr-11 text-[15px]"
                />
                {filters.query && (
                  <button
                    type="button"
                    onClick={() => update("query", "")}
                    aria-label="Xoá từ khoá tìm kiếm"
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-600/60 transition hover:bg-cream-100 hover:text-ink-900"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="btn-outline h-12 flex-1 gap-2 rounded-full px-5 text-[13px] lg:hidden"
                >
                  <SlidersIcon className="h-4 w-4" />
                  Bộ lọc
                  {activeCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-champagne-400 px-1 text-[10px] font-bold text-ink-950">
                      {activeCount}
                    </span>
                  )}
                </button>
                <div className="relative hidden sm:block">
                  <select
                    value={filters.sort}
                    onChange={(event) => update("sort", event.target.value as CarFilters["sort"])}
                    aria-label="Sắp xếp kết quả"
                    className="field h-12 appearance-none rounded-full pl-4 pr-10 text-[13px] font-medium"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <SlidersIcon className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
                </div>
              </div>
            </div>

            {/* Chip bộ lọc đang áp dụng */}
            {activeCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {filters.brands.map((brand) => (
                  <ActiveChip
                    key={brand}
                    label={brand}
                    onRemove={() => update("brands", filters.brands.filter((b) => b !== brand))}
                  />
                ))}
                {filters.bodyTypes.map((body) => (
                  <ActiveChip
                    key={body}
                    label={body}
                    onRemove={() => update("bodyTypes", filters.bodyTypes.filter((b) => b !== body))}
                  />
                ))}
                {filters.fuels.map((fuel) => (
                  <ActiveChip
                    key={fuel}
                    label={`Nhiên liệu: ${fuel}`}
                    onRemove={() => update("fuels", filters.fuels.filter((f) => f !== fuel))}
                  />
                ))}
                {filters.priceRange && (
                  <ActiveChip
                    label={PRICE_RANGES.find((range) => range.id === filters.priceRange)?.label ?? ""}
                    onRemove={() => update("priceRange", null)}
                  />
                )}
                <button
                  type="button"
                  onClick={clearAll}
                  className="ml-1 text-xs font-medium text-champagne-600 underline-offset-4 hover:underline"
                >
                  Xoá tất cả
                </button>
              </div>
            )}
          </div>

          {/* Kết quả */}
          <div className="mt-6 flex items-baseline justify-between gap-4">
            <p className="text-sm text-ink-600/80">
              {showSkeleton ? (
                "Đang tìm xe phù hợp…"
              ) : (
                <>
                  Tìm thấy <span className="font-semibold text-ink-950">{results.length}</span> mẫu xe
                  {filters.query && (
                    <>
                      {" "}
                      cho “<span className="font-medium text-ink-900">{filters.query}</span>”
                    </>
                  )}
                </>
              )}
            </p>
            <div className="sm:hidden">
              <select
                value={filters.sort}
                onChange={(event) => update("sort", event.target.value as CarFilters["sort"])}
                aria-label="Sắp xếp kết quả"
                className="rounded-full border border-cream-300 bg-white px-3 py-2 text-xs"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {showSkeleton
              ? Array.from({ length: 6 }).map((_, index) => <CarCardSkeleton key={index} />)
              : visibleCars.map((car) => <CarCard key={car.id} car={car} />)}
          </div>

          {!showSkeleton && results.length === 0 && (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-cream-300 bg-white/60 px-6 py-16 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-champagne-500">
                <SearchIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-display text-xl text-ink-950">Không tìm thấy mẫu xe phù hợp</h3>
              <p className="mt-2 max-w-sm text-sm text-ink-600/70">
                Thử mở rộng khoảng giá hoặc bỏ một vài bộ lọc để xem thêm lựa chọn khác.
              </p>
              <button type="button" onClick={clearAll} className="btn-outline mt-6">
                Xoá bộ lọc
              </button>
            </div>
          )}

          {!showSkeleton && visibleCount < results.length && (
            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + pageSize)}
                className="btn-outline px-8"
              >
                Xem thêm {Math.min(pageSize, results.length - visibleCount)} xe
              </button>
              <p className="text-xs text-ink-600/55">
                Đang hiển thị {visibleCars.length}/{results.length} mẫu xe
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ============ Drawer bộ lọc (mobile) ============ */}
      {filtersOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Bộ lọc xe">
          <button
            type="button"
            aria-label="Đóng bộ lọc"
            onClick={() => setFiltersOpen(false)}
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-luxe animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl">Bộ lọc xe</h3>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Đóng"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-300"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              activeCount={activeCount}
              onChange={update}
              onClear={clearAll}
            />
            <div className="sticky bottom-0 mt-6 flex gap-3 bg-white pt-3">
              <button type="button" onClick={clearAll} className="btn-outline flex-1">
                Xoá tất cả
              </button>
              <button type="button" onClick={() => setFiltersOpen(false)} className="btn-primary flex-1">
                Xem {results.length} xe
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------ Sub-components ----------------------------- */

type FilterPanelProps = {
  filters: CarFilters;
  activeCount: number;
  onChange: <K extends keyof CarFilters>(key: K, value: CarFilters[K]) => void;
  onClear: () => void;
};

function FilterPanel({ filters, onChange, onClear, activeCount }: FilterPanelProps) {
  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h3 className="hidden font-display text-lg lg:block">Bộ lọc</h3>
        <span className="hidden text-[11px] uppercase tracking-wider text-ink-600/50 lg:block">
          {activeCount > 0 ? `${activeCount} đang áp dụng` : "Tất cả xe"}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-medium text-champagne-600 underline-offset-4 hover:underline lg:ml-auto"
          >
            Xoá
          </button>
        )}
      </div>

      <FilterGroup title="Hãng xe">
        <div className="space-y-2.5">
          {BRANDS.map((brand) => (
            <CheckOption
              key={brand}
              label={brand}
              checked={filters.brands.includes(brand)}
              onChange={() => onChange("brands", toggleItem(filters.brands, brand))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Khoảng giá">
        <div className="space-y-2.5">
          {PRICE_RANGES.map((range) => (
            <CheckOption
              key={range.id}
              label={range.label}
              checked={filters.priceRange === range.id}
              onChange={() =>
                onChange("priceRange", filters.priceRange === range.id ? null : range.id)
              }
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Loại xe">
        <div className="flex flex-wrap gap-2">
          {BODY_TYPES.map((body) => (
            <TogglePill
              key={body}
              label={body}
              active={filters.bodyTypes.includes(body as BodyType)}
              onClick={() => onChange("bodyTypes", toggleItem(filters.bodyTypes, body as BodyType))}
            />
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Nhiên liệu" className="!border-b-0 !pb-0">
        <div className="flex flex-wrap gap-2">
          {FUEL_TYPES.map((fuel) => (
            <TogglePill
              key={fuel}
              label={fuel}
              active={filters.fuels.includes(fuel as FuelType)}
              onClick={() => onChange("fuels", toggleItem(filters.fuels, fuel as FuelType))}
            />
          ))}
        </div>
      </FilterGroup>
    </div>
  );
}

function FilterGroup({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-b border-cream-200 pb-6 ${className}`}>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600/60">
        {title}
      </p>
      {children}
    </div>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="group flex cursor-pointer select-none items-center gap-2.5 text-[13px] text-ink-800">
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition ${
          checked
            ? "border-ink-950 bg-ink-950 text-cream-50"
            : "border-cream-300 bg-white group-hover:border-champagne-400"
        }`}
      >
        {checked && <CheckIcon className="h-3 w-3" strokeWidth={3} />}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      {label}
    </label>
  );
}

function TogglePill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-ink-950 bg-ink-950 text-cream-50"
          : "border-cream-300 bg-white text-ink-700 hover:border-champagne-400"
      }`}
    >
      {label}
    </button>
  );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="chip gap-1.5 border-champagne-300 bg-champagne-50 py-1.5 pr-2 text-ink-800">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Bỏ lọc ${label}`}
        className="flex h-4 w-4 items-center justify-center rounded-full bg-ink-950/10 text-ink-800 transition hover:bg-ink-950 hover:text-cream-50"
      >
        <XIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
      </button>
    </span>
  );
}

function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-200">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="space-y-3 p-5">
        <div className="h-4 w-2/3 rounded bg-cream-200" />
        <div className="h-3 w-1/2 rounded bg-cream-100" />
        <div className="h-10 rounded bg-cream-100" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 w-24 rounded bg-cream-200" />
          <div className="h-9 w-9 rounded-full bg-cream-100" />
        </div>
      </div>
    </div>
  );
}
