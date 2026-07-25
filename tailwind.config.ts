import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      screens: {
        xs: "390px",
      },
      colors: {
        // ── Tokens semánticos (CSS vars) ──────────────────
        background: "var(--background)",
        foreground: "var(--foreground)",
        border:     "var(--border)",

        // ── Paleta "Barro y Jade" (Apúntame) ──────────────
        orange: {
          DEFAULT: "#E8542F",
          light:   "#F0916B",
          dark:    "#C73E1D",
          50:      "#FAEFE5",
          100:     "#F6DCC8",
        },
        purple: {
          DEFAULT: "#7A4FC9",
          light:   "#9C77DC",
          dark:    "#5D38A6",
          50:      "#F1EAFB",
          100:     "#DFD0F5",
          900:     "#241239",
          950:     "#170B26",
        },
        // Jade (verde profundo, sustituye al teal neón)
        teal: {
          DEFAULT: "#17B08A",
          light:   "#6BCDB2",
          dark:    "#0E8C6D",
          50:      "#E8F5F0",
        },
        carbon: "#241C15",
        cream:  {
          DEFAULT: "#FBF5EC",
          warm:    "#F7ECDD",
          muted:   "#F1E6D4",
        },

        // ── Legado (para no romper código existente) ──────
        mint: {
          DEFAULT: "#0E8C6D",
          dark:    "#0B7057",
          light:   "#3FAE8C",
        },
        sand: {
          DEFAULT: "#E9A13B",
          dark:    "#C98426",
          light:   "#F2C06E",
        },
        ink:      "#241C15",
        charcoal: {
          DEFAULT: "#1E1410",
          mid:     "#17100C",
          light:   "#2A1C12",
        },
        lavender: {
          DEFAULT: "#a78bfa",
          light:   "#c4b5fd",
          dark:    "#7c3aed",
        },
      },

      borderRadius: {
        // Nuevos tokens bento
        bento:  "32px",
        "bento-sm": "20px",
        "bento-lg": "40px",
        // Legado
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      boxShadow: {
        bento:    "0 4px 32px rgba(0,0,0,0.06)",
        "bento-hover": "0 12px 48px rgba(0,0,0,0.12)",
        orange:   "0 8px 24px rgba(232,84,47,0.30)",
        purple:   "0 8px 24px rgba(122,79,201,0.25)",
        teal:     "0 8px 24px rgba(23,176,138,0.25)",
        glow:     "0 0 32px rgba(122,79,201,0.20)",
      },

      fontFamily: {
        sans: ["Metropolis", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },

      animation: {
        blob:       "blob 7s infinite",
        shimmer:    "shimmer 1.5s infinite",
        "float":    "float-up 3s ease-in-out infinite",
        "fade-up":  "fade-in-up 0.5s ease forwards",
        "bounce-in":"bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },

      keyframes: {
        blob: {
          "0%":   { transform: "translate(0,0) scale(1)" },
          "33%":  { transform: "translate(30px,-50px) scale(1.1)" },
          "66%":  { transform: "translate(-20px,20px) scale(0.9)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "float-up": {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-8px)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "bounce-in": {
          "0%":   { opacity: "0", transform: "scale(0.7)" },
          "60%":  { transform: "scale(1.05)" },
          "80%":  { transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
