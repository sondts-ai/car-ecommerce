import { BODY_TYPES, CARS, FUEL_TYPES, filterCars, type BodyType, type CarFilters, type FuelType } from "@/lib/cars";
import { latency, ok, fail } from "../_lib/response";

export const dynamic = "force-dynamic";

const SORTS: CarFilters["sort"][] = ["featured", "price-asc", "price-desc", "rating"];

/** GET /api/cars — danh sách + tìm kiếm + lọc + phân trang */
export async function GET(request: Request) {
  await latency(180, 320);
  const url = new URL(request.url);

  const q = url.searchParams.get("q") ?? "";
  const brands = (url.searchParams.get("brands") ?? "").split(",").filter(Boolean);
  const bodyTypes = (url.searchParams.get("bodyTypes") ?? "")
    .split(",")
    .filter((value): value is BodyType => BODY_TYPES.includes(value as BodyType));
  const fuels = (url.searchParams.get("fuels") ?? "")
    .split(",")
    .filter((value): value is FuelType => FUEL_TYPES.includes(value as FuelType));
  const priceRange = url.searchParams.get("priceRange");
  const sortParam = url.searchParams.get("sort");
  const sort = SORTS.includes(sortParam as CarFilters["sort"])
    ? (sortParam as CarFilters["sort"])
    : "featured";

  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") ?? 12) || 12;
  const pageSize = Math.min(50, Math.max(1, pageSizeRaw));

  const filtered = filterCars(CARS, {
    query: q,
    brands,
    bodyTypes,
    fuels,
    priceRange,
    sort,
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (page > totalPages) {
    return fail(400, "VALIDATION_ERROR", `Trang ${page} vượt quá tổng số trang (${totalPages}).`);
  }

  const items = filtered.slice((page - 1) * pageSize, page * pageSize);
  return ok({ items }, { meta: { page, pageSize, total, totalPages } });
}
