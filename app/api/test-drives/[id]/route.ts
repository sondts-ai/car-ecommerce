import { getAuthUser, latency, fail, notFound, ok } from "../../_lib/response";
import { store } from "../../_lib/store";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const user = getAuthUser(request);
  if (!user) return fail(401, "UNAUTHORIZED", "Bạn cần đăng nhập để hủy lịch hẹn.");
  if (user.role !== "CUSTOMER") return fail(403, "FORBIDDEN", "Chỉ khách hàng mới được hủy lịch hẹn.");

  const { id } = await context.params;
  const appointment = store.testDrives.find((item) => item.id === id || item.code === id);
  if (!appointment || store.testDriveOwners.get(appointment.id) !== user.id) {
    return notFound("Không tìm thấy lịch lái thử.");
  }
  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return fail(409, "CONFLICT", "Lịch lái thử này không thể hủy ở trạng thái hiện tại.");
  }

  appointment.status = "cancelled";
  return ok(appointment, { message: "Đã hủy lịch lái thử." });
}
