"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  adminTestDriveApi,
  getErrorMessage,
  type TestDriveDto,
  type TestDriveStatus,
} from "@/lib/api";
import { AlertBanner, formatDateTime } from "@/components/admin/AdminUi";
import { formatDisplayDate, SHOWROOMS } from "@/lib/booking";

const STATUS_LABELS: Record<TestDriveStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
  rejected: "Đã từ chối",
};

const STATUS_TONES: Record<TestDriveStatus, string> = {
  pending: "border-amber-300 bg-amber-50 text-amber-800",
  confirmed: "border-sky-300 bg-sky-50 text-sky-800",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-800",
  cancelled: "border-cream-300 bg-cream-100 text-ink-700",
  rejected: "border-red-300 bg-red-50 text-red-800",
};

const STATUS_FILTERS: Array<TestDriveStatus | "all"> = [
  "all",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "rejected",
];

function showroomName(id: string): string {
  return SHOWROOMS.find((showroom) => showroom.id === id)?.name ?? id;
}

export default function AdminTestDrivesPage() {
  const [appointments, setAppointments] = useState<TestDriveDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<TestDriveStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setAppointments(await adminTestDriveApi.list());
    } catch (err) {
      setError(getErrorMessage(err, "Không tải được lịch lái thử."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  const visibleAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointments.filter((appointment) => {
      if (statusFilter !== "all" && appointment.status !== statusFilter) return false;
      if (!query) return true;
      return [
        appointment.code,
        appointment.customer.fullName,
        appointment.customer.phone,
        appointment.customer.email,
        appointment.carName,
        showroomName(appointment.showroomId),
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [appointments, search, statusFilter]);

  const updateStatus = async (appointment: TestDriveDto, status: TestDriveStatus) => {
    const action =
      status === "confirmed" ? "xác nhận" :
      status === "completed" ? "hoàn tất" :
      status === "rejected" ? "từ chối" : "hủy";
    if (!window.confirm(`Bạn muốn ${action} lịch ${appointment.code}?`)) return;

    setBusyId(appointment.id);
    setError("");
    setSuccess("");
    try {
      await adminTestDriveApi.updateStatus(appointment.id, status);
      setSuccess(`Đã ${action} lịch lái thử ${appointment.code}.`);
      await fetchAppointments();
    } catch (err) {
      setError(getErrorMessage(err, "Không cập nhật được trạng thái lịch lái thử."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow">Lịch hẹn — Customer Service</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">
          Quản lý lịch lái thử
        </h1>
        <p className="mt-1 text-sm text-ink-600">
          Xác nhận khách hẹn, theo dõi lịch showroom và cập nhật kết quả lái thử.
        </p>
      </div>

      <AlertBanner type="error" message={error} onClose={() => setError("")} />
      <AlertBanner type="success" message={success} onClose={() => setSuccess("")} />

      <div className="card flex flex-wrap gap-3 p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm mã lịch, khách hàng, xe hoặc showroom..."
          className="field min-w-56 flex-1 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as TestDriveStatus | "all")}
          className="field w-full py-2 text-sm sm:w-56"
        >
          {STATUS_FILTERS.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "Tất cả trạng thái" : STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void fetchAppointments()}
          className="btn-outline py-2 text-xs"
        >
          Tải lại
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="border-b border-cream-200 bg-cream-50 text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th className="px-5 py-3.5">Lịch / Khách hàng</th>
                <th className="px-5 py-3.5">Xe / Showroom</th>
                <th className="px-5 py-3.5">Thời gian</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ghi chú</th>
                <th className="px-5 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-600">
                    Đang tải lịch hẹn...
                  </td>
                </tr>
              ) : visibleAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-600">
                    Không có lịch lái thử phù hợp.
                  </td>
                </tr>
              ) : (
                visibleAppointments.map((appointment) => (
                  <tr key={appointment.id} className="align-top hover:bg-cream-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-ink-950">{appointment.code}</p>
                      <p className="mt-1 text-xs font-medium text-ink-800">
                        {appointment.customer.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-600">{appointment.customer.phone}</p>
                      {appointment.customer.email && (
                        <p className="mt-0.5 text-xs text-ink-600">{appointment.customer.email}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-900">{appointment.carName}</p>
                      <p className="mt-1 text-xs text-ink-600">{showroomName(appointment.showroomId)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-900">
                        {formatDisplayDate(appointment.date)}
                      </p>
                      <p className="mt-1 text-xs text-ink-600">{appointment.time} · 30 phút</p>
                      <p className="mt-1 text-[11px] text-ink-500">
                        Tạo lúc {formatDateTime(appointment.createdAt)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONES[appointment.status]}`}>
                        {STATUS_LABELS[appointment.status]}
                      </span>
                    </td>
                    <td className="max-w-xs whitespace-normal px-5 py-4 text-xs text-ink-600">
                      {appointment.note || "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        {appointment.status === "pending" && (
                          <button
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() => void updateStatus(appointment, "confirmed")}
                            className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 disabled:opacity-50"
                          >
                            Xác nhận
                          </button>
                        )}
                        {appointment.status === "pending" && (
                          <button
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() => void updateStatus(appointment, "rejected")}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            Từ chối
                          </button>
                        )}
                        {appointment.status === "confirmed" && (
                          <button
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() => void updateStatus(appointment, "completed")}
                            className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 disabled:opacity-50"
                          >
                            Hoàn tất
                          </button>
                        )}
                        {(appointment.status === "pending" || appointment.status === "confirmed") && (
                          <button
                            type="button"
                            disabled={busyId === appointment.id}
                            onClick={() => void updateStatus(appointment, "cancelled")}
                            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
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
