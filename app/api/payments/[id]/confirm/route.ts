import { fail, latency, notFound, ok } from "../../../_lib/response";
import { store } from "../../../_lib/store";

export const dynamic = "force-dynamic";

/** POST /api/payments/{id}/confirm — mock xác nhận thanh toán thành công */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(500, 900);
  const { id } = await context.params;

  const payment = store.payments.find((item) => item.id === id);
  if (!payment) return notFound("Không tìm thấy giao dịch.");

  if (payment.status === "succeeded") {
    return ok(payment, { message: "Giao dịch đã được xác nhận trước đó." });
  }

  const deposit = store.deposits.find((item) => item.id === payment.depositId);
  if (!deposit) return fail(409, "CONFLICT", "Đơn đặt cọc không còn tồn tại.");

  payment.status = "succeeded";
  deposit.status = "paid";
  deposit.holdUntil = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();

  return ok(payment, { message: "Thanh toán thành công." });
}
