import { StarIcon } from "./icons";

type StarRatingProps = {
  value: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  className?: string;
};

const SIZE_MAP = { sm: "h-3 w-3", md: "h-4 w-4", lg: "h-5 w-5" } as const;

export function StarRating({ value, size = "md", showValue, count, className = "" }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(5, value));
  const percent = (clamped / 5) * 100;
  const starClass = SIZE_MAP[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="relative inline-flex"
        role="img"
        aria-label={`Đánh giá ${clamped.toFixed(1)} trên 5 sao`}
      >
        <div className="flex gap-0.5 text-ink-600/20">
          {Array.from({ length: 5 }).map((_, index) => (
            <StarIcon key={index} className={starClass} aria-hidden />
          ))}
        </div>
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${percent}%` }}
          aria-hidden
        >
          <div className="flex gap-0.5 text-champagne-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon key={index} className={`${starClass} shrink-0`} />
            ))}
          </div>
        </div>
      </div>
      {showValue && (
        <span className="text-xs font-semibold text-ink-800">
          {clamped.toFixed(1)}
          {typeof count === "number" && (
            <span className="ml-1 font-normal text-ink-600/60">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
