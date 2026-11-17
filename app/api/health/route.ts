import { latency, ok } from "../_lib/response";

export const dynamic = "force-dynamic";

/** GET /api/health — dùng để kiểm tra mock backend còn sống */
export async function GET() {
  await latency(30, 80);
  return ok({
    status: "ok",
    mock: true,
    version: "1.0.0",
    time: new Date().toISOString(),
    endpoints: [
      "/api/auth/*",
      "/api/customers/me",
      "/api/cars",
      "/api/cars/{slug}",
      "/api/cars/{slug}/availability",
      "/api/cars/{slug}/reviews",
      "/api/deposits",
      "/api/payments/intent",
      "/api/test-drives",
      "/api/test-drives/slots",
    ],
  });
}
