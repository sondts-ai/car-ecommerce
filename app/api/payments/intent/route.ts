import { PAYMENT_METHODS } from "@/lib/booking";
import type { CreatePaymentIntentPayload, PaymentDto, PaymentMethodId } from "@/lib/api/types";
import { created, fail, latency, notFound, parseBody, validationError } from "../../_lib/response";
import { nowIso, store } from "../../_lib/store";

export const dynamic = "force-dynamic";

const METHOD_IDS = PAYMENT_METHODS.map((method) => method.id) as readonly PaymentMethodId[];

/** POST /api/payments/intent — tạo giao dịch thanh toán cho đơn đặt cọc */
export async function POST(request: Request) {
  await latency(320, 560);
  const body = await parseBody<CreatePaymentIntentPayload>(request);
  if (!body) return validationError({}, "Body JSON không hợp lệ.");

  const deposit = store.deposits.find((item) => item.id === body.depositId || item.code === body.depositId);
  if (!deposit) return notFound("Không tìm thấy đơn đặt cọc.");

  if (!METHOD_IDS.includes(body.method)) {
    return validationError({ method: "Phương thức thanh toán không hợp lệ." });
  }
  if (deposit.status !== "pending_payment") {
    return fail(409, "CONFLICT", "Đơn đặt cọc này đã được thanh toán hoặc đã huỷ.");
  }

  const paymentId = `pm_${Date.now().toString(36)}`;
  const payment: PaymentDto = {
    id: paymentId,
    depositId: deposit.id,
    amount: deposit.amount,
    method: body.method,
    status: "pending",
    createdAt: nowIso(),
    redirectUrl:
      body.method === "vnpay"
        ? `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?txn=${paymentId}`
        : undefined,
    qrPayload:
      body.method === "vnpay"
        ? `00020101021238570010A000000727012100069704220110${deposit.code}5303704540${String(
            deposit.amount,
          ).length}${deposit.amount}5802VN6304MOCK`
        : undefined,
  };

  store.payments.unshift(payment);
  return created(payment, "Đã tạo giao dịch thanh toán.");
}
