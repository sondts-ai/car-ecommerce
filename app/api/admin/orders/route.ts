import type { AdminOrder, AdminOrderStatus } from "@/lib/api/admin-types";
import { getCarBySlug } from "@/lib/cars";
import { requireAdmin } from "../../_lib/admin-store";
import { latency, ok } from "../../_lib/response";
import { store } from "../../_lib/store";

export const dynamic = "force-dynamic";

const DEPOSIT_STATUS_MAP: Record<string, AdminOrderStatus> = {
  pending_payment: "PENDING_DEPOSIT",
  paid: "DEPOSIT_PAID",
  confirmed: "CONFIRMED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
};

export async function GET(request: Request) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const items: AdminOrder[] = store.deposits
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((deposit) => {
      const carPrice = getCarBySlug(deposit.carSlug)?.price ?? deposit.amount;
      return {
        id: deposit.id,
        orderCode: deposit.code,
        customer: deposit.customer,
        subtotal: carPrice,
        totalAmount: carPrice,
        depositAmount: deposit.amount,
        remainingAmount: Math.max(0, carPrice - deposit.amount),
        status: DEPOSIT_STATUS_MAP[deposit.status] ?? "PENDING_DEPOSIT",
        reservedUntil: deposit.holdUntil,
        note: deposit.note,
        createdAt: deposit.createdAt,
        items: [
          {
            vehicleId: 0,
            vehicleName: deposit.carName,
            vin: "",
            price: carPrice,
          },
        ],
      };
    });

  return ok({ items });
}
