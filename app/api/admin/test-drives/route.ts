import { requireAdmin } from "../../_lib/admin-store";
import { latency, ok } from "../../_lib/response";
import { store } from "../../_lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await latency(80, 140);
  const auth = requireAdmin(request);
  if ("response" in auth) return auth.response;

  const items = store.testDrives.slice().sort((a, b) => {
    const appointmentA = `${a.date}T${a.time}`;
    const appointmentB = `${b.date}T${b.time}`;
    return appointmentA.localeCompare(appointmentB);
  });
  return ok({ items });
}
