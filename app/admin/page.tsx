"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { adminCarApi, adminInventoryApi, getErrorMessage, type VehicleStats } from "@/lib/api";
import { AlertBanner, CONDITION_LABELS, STATUS_META } from "@/components/admin/AdminUi";
import type { VehicleCondition, VehicleStatus } from "@/lib/api/admin-types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [catalogCounts, setCatalogCounts] = useState({ brands: 0, categories: 0, models: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [vehicleStats, brandsPage, catsPage, modelsPage] = await Promise.all([
          adminInventoryApi.getStats(),
          adminCarApi.listBrands({ page: 0, size: 1 }),
          adminCarApi.listCategories({ page: 0, size: 1 }),
          adminCarApi.listModels({ page: 0, size: 1 }),
        ]);
        if (!active) return;
        setStats(vehicleStats);
        setCatalogCounts({
          brands: brandsPage.totalItems,
          categories: catsPage.totalItems,
          models: modelsPage.totalItems,
        });
      } catch (err) {
        if (active) setError(getErrorMessage(err, "Không tải được dữ liệu thống kê."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const total = stats?.total ?? 0;
  const statusKeys: VehicleStatus[] = ["AVAILABLE", "RESERVED", "SOLD", "MAINTENANCE"];
  const conditionKeys: VehicleCondition[] = ["NEW", "USED"];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
            Tổng quan kho xe & danh mục
          </h1>
        </div>
        <div className="flex gap-2.5">
          <Link href="/admin/vehicles" className="btn-primary py-2.5 text-xs">
            + Quản lý kho xe
          </Link>
          <Link href="/admin/car-models" className="btn-outline py-2.5 text-xs">
            Dòng & phiên bản
          </Link>
        </div>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-28 animate-pulse bg-cream-100" />
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Tổng số xe trong kho" value={total} accent="text-ink-950" sub="Tất cả chi nhánh" />
            <KpiCard
              label="Sẵn sàng bán (AVAILABLE)"
              value={stats?.byStatus?.AVAILABLE ?? 0}
              accent="text-emerald-600"
              sub="Đang mở bán"
            />
            <KpiCard
              label="Đang giữ chỗ (RESERVED)"
              value={stats?.byStatus?.RESERVED ?? 0}
              accent="text-amber-600"
              sub="Chờ hoàn tất đơn"
            />
            <KpiCard
              label="Đã bán (SOLD)"
              value={stats?.byStatus?.SOLD ?? 0}
              accent="text-champagne-600"
              sub="Hoàn tất bàn giao"
            />
          </div>

          {/* Catalog quick stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/admin/brands" className="card p-5 transition hover:border-champagne-400">
              <p className="text-xs font-medium text-ink-600">Hãng xe (Brands)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-950">
                {catalogCounts.brands}
              </p>
              <p className="mt-1 text-xs text-champagne-600">Xem danh sách →</p>
            </Link>
            <Link href="/admin/categories" className="card p-5 transition hover:border-champagne-400">
              <p className="text-xs font-medium text-ink-600">Phân loại xe (Categories)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-950">
                {catalogCounts.categories}
              </p>
              <p className="mt-1 text-xs text-champagne-600">Xem danh sách →</p>
            </Link>
            <Link href="/admin/car-models" className="card p-5 transition hover:border-champagne-400">
              <p className="text-xs font-medium text-ink-600">Dòng xe (Car Models)</p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink-950">
                {catalogCounts.models}
              </p>
              <p className="mt-1 text-xs text-champagne-600">Quản lý dòng & phiên bản →</p>
            </Link>
          </div>

          {/* Breakdown charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-950">
                Phân bổ theo trạng thái xe
              </h2>
              <div className="mt-5 space-y-4">
                {statusKeys.map((key) => {
                  const count = stats?.byStatus?.[key] ?? 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const meta = STATUS_META[key];
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-xs font-medium text-ink-700">
                        <span>{meta.label}</span>
                        <span>
                          {count} xe ({pct}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-cream-200">
                        <div
                          className={`h-full rounded-full ${meta.barClass}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-cream-200 pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-600">
                  Theo tình trạng (Mới / Đã qua sử dụng)
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {conditionKeys.map((c) => (
                    <div key={c} className="rounded-xl border border-cream-200 bg-cream-50 p-3.5">
                      <p className="text-xs text-ink-600">{CONDITION_LABELS[c]}</p>
                      <p className="mt-1 font-display text-xl font-semibold text-ink-950">
                        {stats?.byCondition?.[c] ?? 0} xe
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-ink-950">
                  Số lượng xe theo chi nhánh
                </h2>
                <Link href="/admin/branches" className="text-xs font-medium text-champagne-600 hover:underline">
                  Quản lý chi nhánh
                </Link>
              </div>
              <div className="mt-5 space-y-4">
                {(stats?.byBranch ?? []).length === 0 ? (
                  <p className="text-sm text-ink-600">Chưa có dữ liệu chi nhánh.</p>
                ) : (
                  (stats?.byBranch ?? []).map((b) => {
                    const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                    return (
                      <div key={b.branchId}>
                        <div className="flex justify-between text-xs font-medium text-ink-700">
                          <span>{b.branchName}</span>
                          <span>
                            {b.count} xe ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-cream-200">
                          <div
                            className="h-full rounded-full bg-champagne-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium text-ink-600">{label}</p>
      <p className={`mt-2 font-display text-3xl font-semibold ${accent}`}>{value}</p>
      <p className="mt-1 text-[11px] text-ink-600/70">{sub}</p>
    </div>
  );
}
