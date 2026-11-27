import type { TestDriveStatus } from "@/lib/api/types";
import { requireAdmin } from "../../../../_lib/admin-store";
import { fail, latency, notFound, ok, parseBody } from "../../../../_lib/response";
import { store } from "../../../../_lib/store";

export const dynamic = "force-dynamic";

const STATUSES: TestDriveStatus[] = ["pending", "confirmed", "completed", "cancelled", "rejected"];

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const appointment = store.testDrives.find((item) => item.id === id || item.code === id);
  if (!appointment) return notFound("Không tìm thấy lịch lái thử.");

  const body = await parseBody<{ status: TestDriveStatus }>(request);
  if (!body?.status || !STATUSES.includes(body.status)) {
    return fail(400, "VALIDATION_ERROR", "Trạng thái lịch lái thử không hợp lệ.");
  }
  const allowed =
    (appointment.status === "pending" &&
      (body.status === "confirmed" || body.status === "cancelled" || body.status === "rejected")) ||
    (appointment.status === "confirmed" &&
      (body.status === "completed" || body.status === "cancelled"));
  if (appointment.status !== body.status && !allowed) {
    return fail(409, "CONFLICT", "Không thể chuyển trạng thái lịch lái thử này.");
  }

  appointment.status = body.status;
  return ok(appointment, { message: "Đã cập nhật lịch lái thử." });
}
