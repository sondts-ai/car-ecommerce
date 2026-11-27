"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminOrderApi,
  getErrorMessage,
  type AdminOrder,
  type AdminOrderStatus,
} from "@/lib/api";
import { AlertBanner, formatDateTime } from "@/components/admin/AdminUi";
import { formatVnd } from "@/lib/cars";

const STATUS_LABELS: Record<AdminOrderStatus, string> = {
  PENDING_DEPOSIT: "Chờ đặt cọc",
  DEPOSIT_PAID: "Đã đặt cọc",
  CONFIRMED: "Đã xác nhận",
  WAITING_REMAINING_PAYMENT: "Chờ thanh toán còn lại",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
  REFUNDED: "Đã hoàn tiền",
};

const STATUS_TONES: Record<AdminOrderStatus, string> = {
  PENDING_DEPOSIT: "border-amber-300 bg-amber-50 text-amber-800",
  DEPOSIT_PAID: "border-sky-300 bg-sky-50 text-sky-800",
  CONFIRMED: "border-indigo-300 bg-indigo-50 text-indigo-800",
  WAITING_REMAINING_PAYMENT: "border-amber-300 bg-amber-50 text-amber-800",
  COMPLETED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  CANCELLED: "border-red-300 bg-red-50 text-red-800",
  EXPIRED: "border-cream-300 bg-cream-100 text-ink-700",
  REFUNDED: "border-cream-300 bg-cream-100 text-ink-700",
};

const STATUS_FILTERS: Array<AdminOrderStatus | "ALL"> = [
  "ALL",
  "PENDING_DEPOSIT",
  "DEPOSIT_PAID",
  "CONFIRMED",
  "WAITING_REMAINING_PAYMENT",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
  "REFUNDED",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<AdminOrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await adminOrderApi.list());
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được danh sách đơn đặt cọc."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false;
      if (!query) return true;
      return [
        order.orderCode,
        order.customer?.fullName,
        order.customer?.phone,
        order.customer?.email,
        ...order.items.map((item) => item.vehicleName),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [orders, search, statusFilter]);

  const updateStatus = async (order: AdminOrder, status: AdminOrderStatus) => {
    const confirming = status === "CONFIRMED";
    const message = confirming
      ? `Xác nhận đơn ${order.orderCode} đã thanh toán đặt cọc?`
      : `Hủy đơn ${order.orderCode}? Chỉ đơn chưa thanh toán mới có thể hủy.`;
    if (!window.confirm(message)) return;

    setBusyId(String(order.id));
    setError("");
    setSuccess("");
    try {
      await adminOrderApi.updateStatus(
        order.id,
        status,
        confirming ? "Admin xác nhận đơn sau khi đã thanh toán đặt cọc." : "Admin hủy đơn chờ đặt cọc.",
      );
      setSuccess(`Đã cập nhật trạng thái đơn ${order.orderCode}.`);
      await fetchOrders();
    } catch (err) {
      setError(getErrorMessage(err, "Không cập nhật được trạng thái đơn."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Đơn hàng — Order Service</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
          Quản lý đơn đặt cọc
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Theo dõi xe, khách hàng, tiền cọc và trạng thái xử lý đơn.
        </p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm mã đơn, khách hàng hoặc xe..."
          className="field min-w-56 flex-1 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as AdminOrderStatus | "ALL")}
          className="field w-full py-2 text-sm sm:w-64"
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === "ALL" ? "Tất cả trạng thái" : STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void fetchOrders()} className="btn-outline py-2 text-xs">
          Tải lại
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-5 py-3.5">Đơn / Khách hàng</th>
                <th className="px-5 py-3.5">Xe đặt cọc</th>
                <th className="px-5 py-3.5">Giá trị / Tiền cọc</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-600">
                    Đang tải danh sách đơn...
                  </td>
                </tr>
              ) : visibleOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-600">
                    Không có đơn đặt cọc phù hợp.
                  </td>
                </tr>
              ) : (
                visibleOrders.map((order) => (
                  <tr key={order.id} className="align-top hover:bg-cream-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink-950">{order.orderCode}</p>
                      <p className="mt-1 text-xs text-ink-700">
                        {order.customer?.fullName ?? `Mã khách hàng #${order.customerId ?? "—"}`}
                      </p>
                      {order.customer?.phone && (
                        <p className="mt-0.5 text-xs text-ink-600">{order.customer.phone}</p>
                      )}
                      {order.customer?.email && (
                        <p className="mt-0.5 text-xs text-ink-600">{order.customer.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {order.items.map((item) => (
                        <div key={`${order.id}-${item.vehicleId}-${item.vin}`}>
                          <p className="font-medium text-ink-900">{item.vehicleName}</p>
                          {item.vin && <p className="mt-1 font-mono text-[11px] text-ink-600">{item.vin}</p>}
                        </div>
                      ))}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-900">{formatVnd(order.totalAmount)}</p>
                      <p className="mt-1 text-xs text-champagne-700">
                        Cọc: {formatVnd(order.depositAmount)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-600">
                        Còn lại: {formatVnd(order.remainingAmount)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                      {order.reservedUntil && order.status === "PENDING_DEPOSIT" && (
                        <p className="mt-2 text-[11px] text-ink-600">
                          Giữ xe đến {formatDateTime(order.reservedUntil)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-600">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {order.status === "DEPOSIT_PAID" && (
                        <button
                          type="button"
                          disabled={busyId === String(order.id)}
                          onClick={() => void updateStatus(order, "CONFIRMED")}
                          className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                        >
                          {busyId === String(order.id) ? "Đang lưu..." : "Xác nhận đơn"}
                        </button>
                      )}
                      {order.status === "PENDING_DEPOSIT" && (
                        <button
                          type="button"
                          disabled={busyId === String(order.id)}
                          onClick={() => void updateStatus(order, "CANCELLED")}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                        >
                          {busyId === String(order.id) ? "Đang lưu..." : "Hủy đơn"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
