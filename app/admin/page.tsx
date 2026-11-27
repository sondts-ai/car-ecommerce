"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminCarApi,
  adminInventoryApi,
  adminOrderApi,
  getErrorMessage,
  type AdminOrderStats,
  type VehicleStats,
} from "@/lib/api";
import { AlertBanner, CONDITION_LABELS, STATUS_META } from "@/components/admin/AdminUi";
import type { VehicleCondition, VehicleStatus } from "@/lib/api/admin-types";
import { formatShortVnd } from "@/lib/cars";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<VehicleStats | null>(null);
  const [orderStats, setOrderStats] = useState<AdminOrderStats | null>(null);
  const [catalogCounts, setCatalogCounts] = useState({ brands: 0, categories: 0, models: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderStatsError, setOrderStatsError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      setOrderStatsError("");
      try {
        const [vehicleStats, brandsPage, catsPage, modelsPage, revenueStats] = await Promise.all([
          adminInventoryApi.getStats(),
          adminCarApi.listBrands({ page: 0, size: 1 }),
          adminCarApi.listCategories({ page: 0, size: 1 }),
          adminCarApi.listModels({ page: 0, size: 1 }),
          adminOrderApi.getStats().then(
            (data) => ({ data, error: "" }),
            (err: unknown) => ({
              data: null,
              error: getErrorMessage(err, "Không tải được thống kê đơn hàng."),
            }),
          ),
        ]);
        if (!active) return;
        setStats(vehicleStats);
        setOrderStats(revenueStats.data);
        setOrderStatsError(revenueStats.error);
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
  const monthlyRevenue = orderStats?.monthlyRevenue ?? [];
  const maxRevenue = Math.max(1, ...monthlyRevenue.map((m) => m.revenue));
  const totalOrders = orderStats?.totalOrders ?? 0;
  const completedOrders = orderStats?.completed ?? 0;
  const cancellationRate =
    totalOrders > 0 ? Math.round(((orderStats?.cancelled ?? 0) / totalOrders) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard quản trị</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
            Tổng quan doanh thu & kho xe
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            Doanh thu, doanh số đơn hàng và tình hình tồn kho toàn hệ thống.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link href="/admin/orders" className="btn-outline py-2.5 text-xs">
            Đơn đặt cọc
          </Link>
          <Link href="/admin/test-drives" className="btn-outline py-2.5 text-xs">
            Lịch lái thử
          </Link>
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
          {/* Revenue KPIs */}
          {orderStatsError && (
            <AlertBanner
              type="error"
              message={`Không tải được thống kê doanh thu từ Order Service: ${orderStatsError}`}
              onClose={() => setOrderStatsError("")}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Doanh thu (đơn hoàn tất)"
              value={formatShortVnd(orderStats?.totalRevenue ?? 0)}
              accent="text-emerald-600"
              sub={`${completedOrders} đơn đã hoàn tất`}
            />
            <KpiCard
              label="Doanh thu đặt cọc"
              value={formatShortVnd(orderStats?.totalDepositRevenue ?? 0)}
              accent="text-champagne-600"
              sub="Các đơn đã nhận cọc"
            />
            <KpiCard
              label="Tổng đơn hàng"
              value={totalOrders}
              accent="text-ink-950"
              sub={`${orderStats?.pendingDeposit ?? 0} đơn chờ đặt cọc`}
            />
            <KpiCard
              label="Doanh số xe đã bán"
              value={completedOrders}
              accent="text-sky-600"
              sub={`Tỷ lệ huỷ ${cancellationRate}%`}
            />
          </div>

          {/* Monthly revenue chart */}
          <div className="card p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-950">
                  Doanh thu 6 tháng gần nhất
                </h2>
                <p className="mt-1 text-xs text-ink-600">
                  Tính trên các đơn hàng trạng thái COMPLETED.
                </p>
              </div>
              <p className="text-xs font-medium text-ink-600">
                Tổng: <span className="text-base font-semibold text-ink-950">
                  {formatShortVnd(orderStats?.totalRevenue ?? 0)}
                </span>
              </p>
            </div>

            {monthlyRevenue.length === 0 ? (
              <p className="mt-6 text-sm text-ink-600">Chưa có dữ liệu doanh thu.</p>
            ) : (
              <div className="mt-6 flex items-end gap-2 sm:gap-4">
                {monthlyRevenue.map((month) => {
                  const pct = Math.max(3, Math.round((month.revenue / maxRevenue) * 100));
                  const [year, monthPart] = month.month.split("-");
                  return (
                    <div key={month.month} className="flex flex-1 flex-col items-center gap-2">
                      <span className="text-[10px] font-medium text-ink-600">
                        {month.revenue > 0 ? formatShortVnd(month.revenue) : "—"}
                      </span>
                      <div className="flex h-36 w-full items-end overflow-hidden rounded-t-lg bg-cream-100">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-champagne-600 to-champagne-300"
                          style={{ height: `${pct}%` }}
                          title={`${month.orders} đơn`}
                        />
                      </div>
                      <span className="text-[11px] font-medium text-ink-700">
                        {monthPart}/{year.slice(2)}
                      </span>
                      <span className="text-[10px] text-ink-600/70">{month.orders} đơn</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order status breakdown */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <OrderStatusChip label="Chờ cọc" value={orderStats?.pendingDeposit ?? 0} tone="amber" />
            <OrderStatusChip label="Đã cọc" value={orderStats?.depositPaid ?? 0} tone="sky" />
            <OrderStatusChip label="Đã xác nhận" value={orderStats?.confirmed ?? 0} tone="indigo" />
            <OrderStatusChip label="Hoàn tất" value={completedOrders} tone="emerald" />
            <OrderStatusChip label="Đã huỷ" value={orderStats?.cancelled ?? 0} tone="red" />
            <OrderStatusChip label="Tổng đơn" value={totalOrders} tone="ink" />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-600/70">
              Tồn kho & danh mục
            </p>
            <div className="h-px flex-1 bg-cream-200" />
          </div>

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
  value: number | string;
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

const ORDER_STATUS_TONES = {
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  indigo: "border-indigo-200 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  red: "border-red-200 bg-red-50 text-red-700",
  ink: "border-cream-300 bg-white text-ink-900",
} as const;

function OrderStatusChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: keyof typeof ORDER_STATUS_TONES;
}) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${ORDER_STATUS_TONES[tone]}`}>
      <p className="text-[11px] font-medium opacity-75">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold">{value}</p>
    </div>
  );
}
