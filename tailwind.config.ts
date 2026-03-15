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

        // ── Paleta Pet-Alegre (nueva) ─────────────────────
        orange: {
          DEFAULT: "#FF8C42",
          light:   "#FFB07C",
          dark:    "#E6722A",
          50:      "#FFF4EC",
          100:     "#FFE4CC",
        },
        purple: {
          DEFAULT: "#9B5DE5",
          light:   "#B97FF0",
          dark:    "#7A3FBF",
          50:      "#F3EAFF",
          100:     "#E2CCFF",
          900:     "#1E0A3C",
          950:     "#130626",
        },
        // Verde Menta vibrante (diferente al antiguo mint)
        teal: {
          DEFAULT: "#00F5D4",
          light:   "#80FAE9",
          dark:    "#00C4AA",
          50:      "#EAFFFC",
        },
        carbon: "#1A1A1A",
        cream:  {
          DEFAULT: "#FFF9F0",
          warm:    "#FFF3E3",
          muted:   "#F5EDE0",
        },

        // ── Legado (para no romper código existente) ──────
        mint: {
          DEFAULT: "#4DA18A",
          dark:    "#3d8a75",
          light:   "#6ab8a1",
        },
        sand: {
          DEFAULT: "#E7A977",
          dark:    "#d4935f",
          light:   "#f0bf96",
        },
        ink:      "#2D3748",
        charcoal: {
          DEFAULT: "#1a1a2e",
          mid:     "#16213e",
          light:   "#0f3460",
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
        orange:   "0 8px 24px rgba(255,140,66,0.30)",
        purple:   "0 8px 24px rgba(155,93,229,0.25)",
        teal:     "0 8px 24px rgba(0,245,212,0.25)",
        glow:     "0 0 32px rgba(155,93,229,0.20)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
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
