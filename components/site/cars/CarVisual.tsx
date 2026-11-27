import type { Car } from "@/lib/cars";

type CarVisualProps = {
  car: Car;
  className?: string;
  variant?: "card" | "hero" | "thumb" | "banner";
  children?: React.ReactNode;
};

const VARIANT_HEIGHT = {
  card: "aspect-[16/10]",
  hero: "aspect-[4/3] max-h-[520px] sm:aspect-[16/11]",
  banner: "aspect-[16/7]",
  thumb: "aspect-[4/3]",
} as const;

export function CarVisual({ car, className = "", variant = "card", children }: CarVisualProps) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${car.gradient} ${VARIANT_HEIGHT[variant]} ${className}`}
    >
      {/* Ánh sáng mềm theo màu xe */}
      <div
        className="pointer-events-none absolute -top-1/3 left-1/2 h-[120%] w-[120%] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: `radial-gradient(circle, ${car.accent}55 0%, transparent 62%)` }}
        aria-hidden
      />
      {/* Lưới mảnh tạo cảm giác studio */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
        aria-hidden
      />

      {variant === "hero" && (
        <span
          className="absolute left-5 top-5 font-display text-xl tracking-[0.3em] text-white/20 sm:left-7 sm:top-6 sm:text-2xl"
          aria-hidden
        >
          {car.brand.toUpperCase()}
        </span>
      )}

      <svg
        viewBox="0 34 400 118"
        className={`absolute left-1/2 -translate-x-1/2 text-white/85 drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)] ${
          variant === "hero" ? "bottom-[14%] w-[96%] max-w-[760px]" : "bottom-[16%] w-[92%] max-w-[520px]"
        }`}
        role="presentation"
        aria-hidden
      >
        <defs>
          <linearGradient id={`body-${car.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#dfe3e8" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#9aa3ad" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id={`glass-${car.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={car.accent} stopOpacity="0.85" />
            <stop offset="100%" stopColor="#0b0d10" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        <path
          d="M14 112c0-7 4.6-12.8 11.2-15l31.6-9.4 22.6-19.8C89.2 59.7 101.5 54 114.6 54h57.1c17 0 33.2 6.5 45.2 18.2l13.4 13 42.1 7.6c11.6 2.1 20 12.1 20 23.9v5.3c0 4.2-3.4 7.6-7.6 7.6h-9.2c-2.6-13-14-22.7-27.7-22.7-13.8 0-25.2 9.8-27.8 22.7H97.6c-2.6-13-14-22.7-27.7-22.7-13.8 0-25.2 9.8-27.8 22.7h-8.9c-4.2 0-7.6-3.4-7.6-7.6L14 112Z"
          fill={`url(#body-${car.id})`}
        />
        <path
          d="M116 58h53c14.6 0 28.5 5.6 38.9 15.7l9.4 9.1-106.8-2.4 5.5-22.4Z"
          fill="#0b0d10"
          opacity="0.55"
        />
        <path
          d="M196 58.5c12 1.9 22.7 8 30.6 17.2l5.7 6.6-36.3-23.8Z"
          fill="#0b0d10"
          opacity="0.4"
        />
        <path
          d="M170 74.5 214 74.5 205 61 173 61Z"
          fill={`url(#glass-${car.id})`}
          opacity="0.9"
        />
        <circle cx="69" cy="118" r="23" fill="#0b0d10" />
        <circle cx="69" cy="118" r="11" fill="#8b939c" />
        <circle cx="69" cy="118" r="4" fill="#22262b" />
        <circle cx="300" cy="118" r="23" fill="#0b0d10" />
        <circle cx="300" cy="118" r="11" fill="#8b939c" />
        <circle cx="300" cy="118" r="4" fill="#22262b" />
        <path d="M330 82h17c3.4 0 6.2 2.8 6.2 6.2v9.8" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="3.5" fill="none" />
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" aria-hidden />
      {children}
    </div>
  );
}
