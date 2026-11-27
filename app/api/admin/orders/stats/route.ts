import { fail, getAuthUser, latency, ok, unauthorized } from "@/app/api/_lib/response";

export const dynamic = "force-dynamic";

/** GET /api/admin/orders/stats — fallback mock khi chạy không có backend thật. */
export async function GET(request: Request) {
  const user = getAuthUser(request);
  if (!user) return unauthorized("Bạn cần đăng nhập bằng tài khoản quản trị.");
  if (user.role !== "ADMIN") return fail(403, "FORBIDDEN", "Tài khoản không có quyền ADMIN.");

  await latency(60, 140);

  const now = new Date();
  const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      revenue: 0,
      orders: 0,
    };
  });

  return ok({
    totalOrders: 0,
    pendingDeposit: 0,
    depositPaid: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    totalDepositRevenue: 0,
    monthlyRevenue,
  });
}
