import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        heading: ['Syne', 'sans-serif'],
      },
      colors: {
        gold: {
          DEFAULT: 'hsl(var(--primary))',
          light: 'hsl(var(--primary-light))',
          dark: 'hsl(var(--primary-dark))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        'green-check': 'hsl(var(--success))',
        border: "hsl(var(--border))",
        'border-2': "hsl(var(--border-2))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: {
          DEFAULT: "hsl(var(--background))",
          2: "hsl(var(--background-2))",
        },
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          2: "hsl(var(--foreground-2))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
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
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          2: "hsl(var(--card-2))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        baratona: {
          black: "hsl(var(--baratona-black))",
          blue: "hsl(var(--baratona-blue))",
          yellow: "hsl(var(--baratona-yellow))",
          red: "hsl(var(--baratona-red))",
          green: "hsl(var(--baratona-green))",
        },
        zone: {
          sul: "hsl(var(--zone-sul))",
          centro: "hsl(var(--zone-centro))",
          norte: "hsl(var(--zone-norte))",
          niteroi: "hsl(var(--zone-niteroi))",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius)",
        lg: "var(--radius-md)",
        xl: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        'gold-sm': "var(--shadow-sm)",
        'gold-md': "var(--shadow-md)",
        'gold-lg': "var(--shadow-lg)",
        card: "var(--shadow-card)",
        'glow-gold': "var(--glow-gold)",
        'glow-blue': "var(--glow-blue)",
        'glow-red': "var(--glow-red)",
      },
      transitionTimingFunction: {
        ui: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        micro: "150ms",
        ui: "250ms",
        page: "400ms",
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
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "count-up": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "count-up": "count-up 0.2s ease-out",
        "confetti-fall": "confetti-fall 3s linear infinite",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
