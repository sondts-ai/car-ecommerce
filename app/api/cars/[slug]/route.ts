import { getCarBySlug } from "@/lib/cars";
import { latency, notFound, ok } from "../../_lib/response";

export const dynamic = "force-dynamic";

/** GET /api/cars/{slug} */
export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  await latency(160, 300);
  const { slug } = await context.params;
  const car = getCarBySlug(slug);
  if (!car) return notFound("Không tìm thấy mẫu xe.");
  return ok(car);
}
