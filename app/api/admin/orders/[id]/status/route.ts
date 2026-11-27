import type { AdminOrderStatus } from "@/lib/api/admin-types";
import { requireAdmin } from "../../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../../_lib/response";
import { store } from "../../../../_lib/store";

export const dynamic = "force-dynamic";

const TARGET_STATUS_MAP: Partial<Record<AdminOrderStatus, "confirmed" | "cancelled">> = {
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
};

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const deposit = store.deposits.find((item) => item.id === id || item.code === id);
  if (!deposit) return notFound("Không tìm thấy đơn đặt cọc.");

  const body = await parseBody<{ status: AdminOrderStatus; note: string }>(request);
  const targetStatus = body?.status ? TARGET_STATUS_MAP[body.status] : undefined;
  if (!targetStatus || !body?.note?.trim()) {
    return fail(400, "VALIDATION_ERROR", "Trạng thái mới và ghi chú xử lý là bắt buộc.");
  }
  const canCancelUnpaid = deposit.status === "pending_payment" && targetStatus === "cancelled";
  const canConfirmPaid = deposit.status === "paid" && targetStatus === "confirmed";
  if (deposit.status !== targetStatus && !canCancelUnpaid && !canConfirmPaid) {
    return fail(409, "CONFLICT", "Không thể chuyển trạng thái đơn đặt cọc này.");
  }

  deposit.status = targetStatus;
  return ok({ ok: true }, { message: "Đã cập nhật trạng thái đơn đặt cọc." });
}
