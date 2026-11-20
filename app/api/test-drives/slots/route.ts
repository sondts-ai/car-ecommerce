import { getCarBySlug } from "@/lib/cars";
import { SHOWROOMS, TEST_DRIVE_SLOTS, isSlotUnavailable } from "@/lib/booking";
import type { TestDriveSlotsDto } from "@/lib/api/types";
import { fail, latency, notFound, ok, validationError } from "../../_lib/response";
import { store } from "../../_lib/store";
import { isValidDateString } from "../../_lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/test-drives/slots?carSlug=&showroomId=&date= */
export async function GET(request: Request) {
  await latency(200, 360);
  const url = new URL(request.url);
  const carSlug = url.searchParams.get("carSlug") ?? "";
  const showroomId = url.searchParams.get("showroomId") ?? "";
  const date = url.searchParams.get("date") ?? "";

  const errors: Record<string, string> = {};
  if (!getCarBySlug(carSlug)) errors.carSlug = "Mẫu xe không tồn tại.";
  if (!SHOWROOMS.some((showroom) => showroom.id === showroomId)) {
    errors.showroomId = "Showroom không hợp lệ.";
  }
  if (!isValidDateString(date)) errors.date = "Ngày lái thử không hợp lệ.";
  if (Object.keys(errors).length > 0) return validationError(errors);

  if (!getCarBySlug(carSlug)) return notFound("Không tìm thấy mẫu xe.");

  const booked = new Set(
    store.testDrives
      .filter(
        (item) =>
          item.carSlug === carSlug &&
          item.showroomId === showroomId &&
          item.date === date &&
          item.status !== "cancelled",
      )
      .map((item) => item.time),
  );

  const payload: TestDriveSlotsDto = {
    carSlug,
    showroomId,
    date,
    slots: TEST_DRIVE_SLOTS.map((time) => ({
      time,
      available: !booked.has(time) && !isSlotUnavailable(date, time, showroomId),
    })),
  };

  return ok(payload);
}
