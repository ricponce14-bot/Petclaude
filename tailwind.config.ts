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
                background: "var(--background)",
                foreground: "var(--foreground)",
                border: "var(--border)",
                // Paleta Premium
                charcoal: {
                    DEFAULT: "#1a1a2e",
                    mid: "#16213e",
                    light: "#0f3460",
                },
                cream: {
                    DEFAULT: "#f5f0e8",
                    warm: "#ede8dc",
                    muted: "#d4cdc1",
                },
                lavender: {
                    DEFAULT: "#a78bfa",
                    light: "#c4b5fd",
                    dark: "#7c3aed",
                },
            },
            borderRadius: {
                "4xl": "2rem",
                "5xl": "2.5rem",
            },
        },
    },
    plugins: [],
};
export default config;
