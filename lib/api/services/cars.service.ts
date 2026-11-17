import type { Car } from "@/lib/cars";
import { ENDPOINTS } from "../config";
import { buildQuery, http } from "../http";
import type {
  AvailabilityDto,
  CarListQuery,
  CarListResult,
  CreateReviewPayload,
  ReviewDto,
} from "../types";

export const carsApi = {
  /** GET /cars?q=&brands=&bodyTypes=&fuels=&priceRange=&sort=&page=&pageSize= */
  async list(query: CarListQuery = {}): Promise<CarListResult> {
    const search = buildQuery({
      q: query.q,
      brands: query.brands,
      bodyTypes: query.bodyTypes,
      fuels: query.fuels,
      priceRange: query.priceRange ?? undefined,
      sort: query.sort,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 12,
    });
    const { data, meta } = await http.get<{ items: Car[] }>(`${ENDPOINTS.cars.list}${search}`);
    return {
      items: data.items,
      meta: meta ?? { page: 1, pageSize: data.items.length, total: data.items.length, totalPages: 1 },
    };
  },

  /** GET /cars/{slug} */
  async getBySlug(slug: string): Promise<Car> {
    const { data } = await http.get<Car>(ENDPOINTS.cars.detail(slug));
    return data;
  },

  /** GET /cars/{slug}/availability — UC: Kiểm tra tình trạng xe */
  async checkAvailability(slug: string): Promise<AvailabilityDto> {
    const { data } = await http.get<AvailabilityDto>(ENDPOINTS.cars.availability(slug));
    return data;
  },

  /** GET /cars/{slug}/reviews */
  async listReviews(slug: string): Promise<ReviewDto[]> {
    const { data } = await http.get<{ items: ReviewDto[] }>(ENDPOINTS.cars.reviews(slug));
    return data.items;
  },

  /** POST /cars/{slug}/reviews */
  async createReview(slug: string, payload: CreateReviewPayload): Promise<ReviewDto> {
    const { data } = await http.post<ReviewDto>(ENDPOINTS.cars.reviews(slug), payload);
    return data;
  },
};
