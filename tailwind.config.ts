import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "0.855rem",  /* 0.9rem * 0.95 */
        sm: "1.71rem",        /* 1.8rem * 0.95 */
        lg: "3.42rem",        /* 3.6rem * 0.95 */
      },
      screens: {
        sm: "547.2px",    /* 576px * 0.95 */
        md: "656.45px",   /* 691px * 0.95 */
        lg: "875.9px",    /* 922px * 0.95 */
        xl: "1094.4px",   /* 1152px * 0.95 */
        "2xl": "1197px",  /* 1260px * 0.95 */
      },
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      spacing: {
        container: "var(--container-padding)",
        "0": "0",
        "1": "0.2375rem",  // 95% of 0.25rem
        "2": "0.475rem",   // 95% of 0.5rem
        "3": "0.7125rem",  // 95% of 0.75rem
        "4": "0.95rem",    // 95% of 1rem
        "5": "1.1875rem",  // 95% of 1.25rem
        "6": "1.425rem",   // 95% of 1.5rem
        "8": "1.9rem",     // 95% of 2rem
        "10": "2.375rem",  // 95% of 2.5rem
        "12": "2.85rem",   // 95% of 3rem
        "16": "3.8rem",    // 95% of 4rem
      },
      fontSize: {
        xs: ["0.7125rem", { lineHeight: "0.95rem" }],      // 95% of 0.75rem
        sm: ["0.855rem", { lineHeight: "1.1875rem" }],     // 95% of 0.9rem
        base: ["0.95rem", { lineHeight: "1.425rem" }],     // 95% of 1rem
        lg: ["1.0925rem", { lineHeight: "1.6625rem" }],    // 95% of 1.15rem
        xl: ["1.1875rem", { lineHeight: "1.805rem" }],     // 95% of 1.25rem
        "2xl": ["1.425rem", { lineHeight: "1.9rem" }],     // 95% of 1.5rem
        "3xl": ["1.7575rem", { lineHeight: "2.1375rem" }], // 95% of 1.85rem
        "4xl": ["2.09rem", { lineHeight: "2.375rem" }],    // 95% of 2.2rem
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
