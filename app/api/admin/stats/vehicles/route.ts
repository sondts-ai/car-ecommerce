import { computeVehicleStats, requireAdmin } from "../../../_lib/admin-store";
import { latency, ok } from "../../../_lib/response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(60, 120);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;
  return ok(computeVehicleStats(), { message: "Thống kê xe" });
}
