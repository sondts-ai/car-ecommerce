import { getCarBySlug } from "@/lib/cars";
import type { CreateReviewPayload, ReviewDto } from "@/lib/api/types";
import { getAuthUser, latency, notFound, ok, parseBody, validationError } from "../../../_lib/response";
import { store } from "../../../_lib/store";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ slug: string }> };

/** GET /api/cars/{slug}/reviews */
export async function GET(_request: Request, context: Context) {
  await latency(160, 280);
  const { slug } = await context.params;
  if (!getCarBySlug(slug)) return notFound("Không tìm thấy mẫu xe.");
  const items = store.reviews
    .filter((review) => review.carSlug === slug)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return ok({ items });
}

/** POST /api/cars/{slug}/reviews */
export async function POST(request: Request, context: Context) {
  await latency(260, 420);
  const { slug } = await context.params;
  if (!getCarBySlug(slug)) return notFound("Không tìm thấy mẫu xe.");

  const body = await parseBody<CreateReviewPayload>(request);
  if (!body) return validationError({}, "Body JSON không hợp lệ.");

  const errors: Record<string, string> = {};
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = "Điểm đánh giá phải từ 1 đến 5 sao.";
  }
  const content = (body.content ?? "").trim();
  if (content.length < 20) errors.content = "Nội dung đánh giá cần tối thiểu 20 ký tự.";
  if (Object.keys(errors).length > 0) return validationError(errors);

  const user = getAuthUser(request);
  const review: ReviewDto = {
    id: `rv_${Date.now().toString(36)}`,
    carSlug: slug,
    author: user?.fullName ?? "Khách hàng AutoWeb",
    rating,
    title: (body.title ?? "").trim() || "Đánh giá của tôi",
    content,
    createdAt: new Date().toISOString(),
    verified: Boolean(user),
  };

  store.reviews.unshift(review);
  return ok(review, { status: 201, message: "Cảm ơn bạn đã gửi đánh giá!" });
}
