import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },

        /* Primary brand — electric indigo */
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },

        /* 🇮🇳 Saffron — Indian identity accent */
        saffron: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#FF6B00",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },

        /* 🦚 Peacock — South Indian teal-blue */
        peacock: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },

        /* 🌙 Turmeric — gold/marigold accent */
        turmeric: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
        },

        /* Warm accent — fire orange */
        fire: {
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
        },

        /* Warm dark sidebar palette */
        sidebar: {
          bg: "#0f0c08",
          "bg-hover": "#1a1510",
          border: "#2a2218",
          text: "#78716c",
          "text-hover": "#d6d3d1",
          "text-active": "#fafaf9",
          "active-bg": "#1f1a14",
        },

        /* Content surface */
        surface: {
          DEFAULT: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Instrument Serif", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        devanagari: ["Noto Sans Devanagari", "Inter", "sans-serif"],
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "2xl": "1rem",
        "3xl": "1.25rem",
      },

      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 4px rgba(15,23,42,0.06)",
        "card-md": "0 2px 4px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.08)",
        "card-lg": "0 4px 8px rgba(15,23,42,0.04), 0 8px 32px rgba(15,23,42,0.12)",
        "card-xl": "0 8px 16px rgba(15,23,42,0.06), 0 24px 48px rgba(15,23,42,0.16)",
        glow: "0 0 0 3px rgba(99,102,241,0.25)",
        "glow-brand": "0 0 24px rgba(79,70,229,0.35)",
        "glow-saffron": "0 0 24px rgba(255,107,0,0.4)",
        "glow-peacock": "0 0 20px rgba(16,185,129,0.35)",
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "sidebar-gradient": "linear-gradient(180deg, #0f0c08 0%, #0d0a05 100%)",
        "brand-gradient": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        "saffron-gradient": "linear-gradient(135deg, #FF6B00 0%, #fbbf24 100%)",
        "peacock-gradient": "linear-gradient(135deg, #059669 0%, #0891b2 100%)",
        "india-gradient": "linear-gradient(135deg, #FF6B00 0%, #ffffff 50%, #138808 100%)",
        "hero-gradient": "linear-gradient(135deg, #0f0c08 0%, #1a0f00 50%, #0a0a14 100%)",
        "mesh-gradient": "radial-gradient(at 40% 20%, rgba(255,107,0,0.12) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(79,70,229,0.10) 0, transparent 50%), radial-gradient(at 0% 50%, rgba(16,185,129,0.08) 0, transparent 50%)",
        "rangoli-radial": "radial-gradient(circle at center, rgba(255,107,0,0.15) 0%, rgba(251,191,36,0.08) 30%, transparent 65%)",
      },

      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "rangoli-spin": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.05)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "pulse-saffron": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        shimmer: "shimmer 2s linear infinite",
        marquee: "marquee 28s linear infinite",
        float: "float 4s ease-in-out infinite",
        "rangoli-spin": "rangoli-spin 20s linear infinite",
        "pulse-saffron": "pulse-saffron 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
