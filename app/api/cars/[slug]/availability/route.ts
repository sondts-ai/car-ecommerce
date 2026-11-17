import { getCarBySlug } from "@/lib/cars";
import type { AvailabilityDto } from "@/lib/api/types";
import { latency, notFound, ok } from "../../../_lib/response";

export const dynamic = "force-dynamic";

/**
 * GET /api/cars/{slug}/availability
 * UC: Kiểm tra tình trạng xe — trả về tồn kho theo thời gian thực (mock).
 */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  await latency(700, 1100);
  const { slug } = await context.params;
  const car = getCarBySlug(slug);
  if (!car) return notFound("Không tìm thấy mẫu xe.");

  const payload: AvailabilityDto = {
    carSlug: car.slug,
    status: car.stock > 0 ? "available" : "unavailable",
    unitsLeft: car.stock,
    checkedAt: new Date().toISOString(),
    holdMinutes: 15,
    note:
      car.stock > 0
        ? "Xe đang trong kho và sẵn sàng giao trong 7–14 ngày."
        : "Mẫu xe này tạm hết hàng. Vui lòng để lại thông tin để nhận thông báo.",
  };

  return ok(payload);
}
