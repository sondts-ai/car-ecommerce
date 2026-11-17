import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#08090B",
          900: "#0E1013",
          800: "#15181D",
          700: "#1D2127",
          600: "#2A2F37",
        },
        champagne: {
          50: "#FBF7EE",
          100: "#F4EAD3",
          200: "#E9D5AA",
          300: "#DCC083",
          400: "#C9A96A",
          500: "#B8924F",
          600: "#9A7640",
        },
        cream: {
          50: "#FBFAF7",
          100: "#F5F2EC",
          200: "#EAE5DB",
          300: "#DBD3C5",
        },
        emerald: {
          500: "#1F9D6B",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Cormorant Garamond", "Georgia", "serif"],
        sans: ["Inter", "Be Vietnam Pro", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        luxe: "0 24px 60px -30px rgba(8, 9, 11, 0.45)",
        card: "0 2px 12px -6px rgba(8, 9, 11, 0.18)",
      },
      backgroundImage: {
        "gold-line": "linear-gradient(90deg, transparent, #C9A96A, transparent)",
      },
      letterSpacing: {
        widest2: "0.28em",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
