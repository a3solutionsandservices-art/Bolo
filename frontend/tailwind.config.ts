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

        /* Dark sidebar palette */
        sidebar: {
          bg: "#0c1525",
          "bg-hover": "#142035",
          border: "#1e2d47",
          text: "#64748b",
          "text-hover": "#cbd5e1",
          "text-active": "#f1f5f9",
          "active-bg": "#1a2d4a",
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
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "sidebar-gradient": "linear-gradient(180deg, #0c1525 0%, #0a1020 100%)",
        "brand-gradient": "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        "hero-gradient": "linear-gradient(135deg, #0c1525 0%, #0f1f3d 50%, #1a1040 100%)",
        "mesh-gradient": "radial-gradient(at 40% 20%, rgba(79,70,229,0.15) 0, transparent 50%), radial-gradient(at 80% 0%, rgba(124,58,237,0.1) 0, transparent 50%), radial-gradient(at 0% 50%, rgba(79,70,229,0.08) 0, transparent 50%)",
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
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
