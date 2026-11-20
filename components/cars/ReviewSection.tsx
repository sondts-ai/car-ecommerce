"use client";

import { useEffect, useMemo, useState } from "react";
import type { Car } from "@/lib/cars";
import { StarRating } from "@/components/ui/StarRating";
import { StarIcon } from "@/components/ui/icons";
import { carsApi, getErrorDetails, getErrorMessage } from "@/lib/api";
import type { ReviewDto } from "@/lib/api/types";

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
};

const SEED_REVIEWS: Record<string, Review[]> = {
  default: [
    {
      id: "r1",
      author: "Trần Minh Quân",
      rating: 5,
      date: "12/10/2026",
      title: "Trải nghiệm mua xe rất chuyên nghiệp",
      content:
        "Đặt cọc online buổi tối, sáng hôm sau đã có chuyên viên gọi xác nhận. Xe giao đúng hẹn, nội thất sạch sẽ và được hướng dẫn sử dụng rất kỹ.",
      verified: true,
    },
    {
      id: "r2",
      author: "Nguyễn Thu Hà",
      rating: 4,
      date: "28/09/2026",
      title: "Xe vận hành êm, dịch vụ tốt",
      content:
        "Mình chọn bản màu trắng, nhận xe sau 9 ngày. Điểm trừ nhỏ là thời gian chờ làm hợp đồng hơi lâu, còn lại mọi thứ ổn.",
      verified: true,
    },
    {
      id: "r3",
      author: "Lê Hoàng Nam",
      rating: 5,
      date: "05/09/2026",
      title: "Đáng từng đồng",
      content:
        "Lái thử tại showroom Tây Hồ rồi quyết định luôn. Cảm giác lái chắc chắn, cách âm tốt, gia đình rất hài lòng.",
      verified: false,
    },
  ],
};

function toLocalReview(review: ReviewDto): Review {
  return {
    id: review.id,
    author: review.author,
    rating: review.rating,
    date: new Date(review.createdAt).toLocaleDateString("vi-VN"),
    title: review.title,
    content: review.content,
    verified: review.verified,
  };
}

export function ReviewSection({ car }: { car: Car }) {  const [reviews, setReviews] = useState<Review[]>(SEED_REVIEWS.default);
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Tải đánh giá từ API; nếu lỗi thì giữ dữ liệu mẫu */
  useEffect(() => {
    let cancelled = false;
    carsApi
      .listReviews(car.slug)
      .then((items) => {
        if (cancelled) return;
        if (items.length > 0) setReviews(items.map(toLocalReview));
      })
      .catch(() => {
        /* fallback: giữ SEED_REVIEWS */
      });
    return () => {
      cancelled = true;
    };
  }, [car.slug]);

  const average = useMemo(() => {
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return reviews.length ? total / reviews.length : 0;
  }, [reviews]);

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((review) => review.rating === star).length;
      return { star, count, percent: reviews.length ? (count / reviews.length) * 100 : 0 };
    });
  }, [reviews]);

  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (content.trim().length < 20) {
      setError("Vui lòng chia sẻ ít nhất 20 ký tự để đánh giá hữu ích hơn.");
      return;
    }
    setError("");
    setSubmitted(false);
    setSubmitting(true);
    try {
      const created = await carsApi.createReview(car.slug, {
        rating,
        title: title.trim() || undefined,
        content: content.trim(),
      });
      setReviews((prev) => [toLocalReview(created), ...prev]);
      setSubmitted(true);
      setTitle("");
      setContent("");
      setRating(5);
    } catch (submitError) {
      const details = getErrorDetails(submitError);
      setError(
        details.content ??
          details.rating ??
          getErrorMessage(submitError, "Không thể gửi đánh giá. Vui lòng thử lại."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="danh-gia" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Đánh giá & bình luận</p>
          <h2 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
            Khách hàng nói gì về {car.name}
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-card">
          <span className="font-display text-2xl text-ink-950">{average.toFixed(1)}</span>
          <div>
            <StarRating value={average} size="sm" />
            <p className="mt-0.5 text-[11px] text-ink-600/60">{reviews.length} đánh giá</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Tổng quan */}
        <div className="h-fit rounded-2xl border border-cream-200 bg-white p-5 shadow-card">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-600/55">
            Phân bố điểm
          </p>
          <div className="mt-3 space-y-2">
            {distribution.map((item) => (
              <div key={item.star} className="flex items-center gap-2.5 text-xs text-ink-700">
                <span className="flex w-7 items-center gap-0.5">
                  {item.star}
                  <StarIcon className="h-3 w-3 text-champagne-400" />
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-200">
                  <span
                    className="block h-full rounded-full bg-champagne-400"
                    style={{ width: `${item.percent}%` }}
                  />
                </span>
                <span className="w-6 text-right text-ink-600/60">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl bg-cream-100 p-3.5 text-[11px] leading-relaxed text-ink-700">
            96% khách hàng đã mua xe tại AutoWeb sẵn sàng giới thiệu cho bạn bè và người thân.
          </div>
        </div>

        {/* Danh sách + form */}
        <div className="space-y-4">
          {reviews.slice(0, 3).map((review) => (
            <article key={review.id} className="rounded-2xl border border-cream-200 bg-white p-5">
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-950 font-display text-sm text-champagne-300">
                    {review.author.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-950">{review.author}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <StarRating value={review.rating} size="sm" />
                      <span className="text-[11px] text-ink-600/50">{review.date}</span>
                    </div>
                  </div>
                </div>
                {review.verified && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-500">
                    Đã mua xe
                  </span>
                )}
              </header>
              <h3 className="mt-3 text-sm font-semibold text-ink-900">{review.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700/85">{review.content}</p>
            </article>
          ))}

          {/* Form đánh giá */}
          <div className="rounded-2xl border border-cream-200 bg-white p-5 sm:p-6">
            <h3 className="font-display text-xl text-ink-950">Viết đánh giá của bạn</h3>
            <p className="mt-1 text-[13px] text-ink-600/70">
              Chia sẻ trải nghiệm thực tế để giúp khách hàng khác lựa chọn dễ hơn.
            </p>

            {submitted && (
              <div className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-4 py-3 text-[13px] text-emerald-700">
                Cảm ơn bạn! Đánh giá đã được ghi nhận và sẽ hiển thị sau khi kiểm duyệt.
              </div>
            )}

            <form onSubmit={submitReview} className="mt-4 space-y-4">
              <div>
                <p className="field-label">Chấm điểm</p>
                <div className="flex items-center gap-1.5" onMouseLeave={() => setHovered(0)}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hovered || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        aria-label={`${star} sao`}
                        aria-pressed={rating === star}
                        className="rounded p-0.5 transition-transform hover:scale-110"
                      >
                        <StarIcon
                          className={`h-7 w-7 transition-colors ${
                            active ? "text-champagne-400" : "text-ink-600/20"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-medium text-ink-700">
                    {["Rất tệ", "Tệ", "Bình thường", "Tốt", "Tuyệt vời"][(hovered || rating) - 1]}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="review-title" className="field-label">
                  Tiêu đề
                </label>
                <input
                  id="review-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={80}
                  placeholder="Ví dụ: Xe vận hành êm, dịch vụ chuyên nghiệp"
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="review-content" className="field-label">
                  Nội dung đánh giá <span className="text-champagne-600">*</span>
                </label>
                <textarea
                  id="review-content"
                  rows={4}
                  value={content}
                  onChange={(event) => {
                    setContent(event.target.value);
                    if (error) setError("");
                  }}
                  maxLength={800}
                  placeholder="Cảm nhận của bạn về thiết kế, vận hành, dịch vụ và quá trình nhận xe…"
                  className={`field resize-none ${error ? "field-error" : ""}`}
                  aria-invalid={Boolean(error)}
                />
                <div className="mt-1 flex justify-between">
                  <span className="field-error-text !mt-0">{error}</span>
                  <span className="text-[11px] text-ink-600/50">{content.length}/800</span>
                </div>
              </div>

              <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                <p className="text-[11px] text-ink-600/55">
                  Đánh giá sẽ được kiểm duyệt trước khi hiển thị công khai.
                </p>
                <button type="submit" disabled={submitting} className="btn-primary px-7">
                  {submitting ? "Đang gửi…" : "Gửi đánh giá"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
