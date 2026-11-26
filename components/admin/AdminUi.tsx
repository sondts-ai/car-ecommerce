"use client";

import type { ReactNode } from "react";
import type {
  DocumentType,
  FuelType,
  Transmission,
  VehicleCondition,
  VehicleStatus,
} from "@/lib/api/admin-types";

export const FUEL_LABELS: Record<FuelType, string> = {
  GASOLINE: "Xăng",
  DIESEL: "Dầu (Diesel)",
  HYBRID: "Hybrid",
  ELECTRIC: "Điện (EV)",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  AUTO: "Tự động (AT)",
  MANUAL: "Số sàn (MT)",
  CVT: "Vô cấp (CVT)",
  DCT: "Ly hợp kép (DCT)",
};

export const CONDITION_LABELS: Record<VehicleCondition, string> = {
  NEW: "Xe mới",
  USED: "Xe đã qua sử dụng",
};

export const STATUS_META: Record<VehicleStatus, { label: string; badgeClass: string; barClass: string }> = {
  AVAILABLE: {
    label: "Sẵn sàng bán",
    badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
    barClass: "bg-emerald-500",
  },
  RESERVED: {
    label: "Đang giữ chỗ",
    badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-700",
    barClass: "bg-amber-500",
  },
  SOLD: {
    label: "Đã bán",
    badgeClass: "border-ink-900/20 bg-ink-900 text-cream-50",
    barClass: "bg-ink-900",
  },
  MAINTENANCE: {
    label: "Đang bảo trì",
    badgeClass: "border-red-500/30 bg-red-500/10 text-red-700",
    barClass: "bg-red-500",
  },
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  REGISTRATION: "Đăng ký xe (Cà vẹt)",
  INSPECTION: "Đăng kiểm",
  INSURANCE: "Bảo hiểm",
  INVOICE: "Hóa đơn GTGT",
  OTHER: "Giấy tờ khác",
};

export function formatVnd(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(amount)) return "—";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    badgeClass: "border-cream-300 bg-cream-100 text-ink-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.badgeClass}`}
    >
      {meta.label}
    </span>
  );
}

export function ConditionBadge({ condition }: { condition: VehicleCondition }) {
  const isNew = condition === "NEW";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        isNew
          ? "border-champagne-400/50 bg-champagne-50 text-champagne-600"
          : "border-cream-300 bg-cream-100 text-ink-700"
      }`}
    >
      {CONDITION_LABELS[condition] ?? condition}
    </span>
  );
}

export function AlertBanner({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose?: () => void;
}) {
  if (!message) return null;
  const cls =
    type === "error"
      ? "border-red-300/80 bg-red-50 text-red-700"
      : "border-emerald-500/35 bg-emerald-500/10 text-emerald-800";
  return (
    <div
      role="alert"
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-[13px] ${cls}`}
    >
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-xs font-semibold opacity-70 hover:opacity-100"
        >
          Đóng
        </button>
      )}
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  totalItems,
  size,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  size: number;
  onPageChange: (nextPage: number) => void;
}) {
  const safeTotalPages = Math.max(1, totalPages);
  const start = totalItems === 0 ? 0 : page * size + 1;
  const end = Math.min(totalItems, (page + 1) * size);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-cream-200 px-5 py-3.5 text-xs text-ink-600">
      <span>
        Hiển thị <strong className="text-ink-900">{start}–{end}</strong> trên tổng{" "}
        <strong className="text-ink-900">{totalItems}</strong> bản ghi
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-cream-300 bg-white px-3 py-1.5 font-medium text-ink-800 transition hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>
        <span className="px-2 font-medium text-ink-800">
          Trang {page + 1} / {safeTotalPages}
        </span>
        <button
          type="button"
          disabled={page + 1 >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-cream-300 bg-white px-3 py-1.5 font-medium text-ink-800 transition hover:border-ink-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}

export function AdminModal({
  open,
  title,
  subtitle,
  onClose,
  maxWidth = "max-w-xl",
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  maxWidth?: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className={`max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-cream-200 bg-white shadow-luxe ${maxWidth}`}>
        <div className="flex items-start justify-between gap-4 border-b border-cream-200 px-6 py-4">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-950">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-600/75">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-cream-200 px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:border-ink-900 hover:text-ink-950"
          >
            Đóng
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
