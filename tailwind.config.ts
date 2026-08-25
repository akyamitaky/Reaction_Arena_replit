
import { Config } from "tailwindcss";

const tailwindConfig: Config = {
  darkMode: ["class"],
  content: ["src/**/*.{ts,tsx,css}"],
  theme: {
    extend: {
      "fontFamily": {
        "sans": [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "\"Segoe UI\"",
          "Roboto",
          "\"Helvetica Neue\"",
          "Arial",
          "\"Noto Sans\"",
          "sans-serif",
          "\"Apple Color Emoji\"",
          "\"Segoe UI Emoji\"",
          "\"Segoe UI Symbol\"",
          "\"Noto Color Emoji\""
        ],
        "display": [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        "mono": [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "\"Liberation Mono\"",
          "\"Courier New\"",
          "monospace"
        ]
      },
      "colors": {
        "border": "hsl(var(--border))",
        "input": "hsl(var(--input))",
        "ring": "hsl(var(--ring))",
        "background": "hsl(var(--background))",
        "foreground": "hsl(var(--foreground))",
        "primary": {
          "DEFAULT": "hsl(var(--primary))",
          "foreground": "hsl(var(--primary-foreground))"
        },
        "secondary": {
          "DEFAULT": "hsl(var(--secondary))",
          "foreground": "hsl(var(--secondary-foreground))"
        },
        "destructive": {
          "DEFAULT": "hsl(var(--destructive))",
          "foreground": "hsl(var(--destructive-foreground))"
        },
        "muted": {
          "DEFAULT": "hsl(var(--muted))",
          "foreground": "hsl(var(--muted-foreground))"
        },
        "accent": {
          "DEFAULT": "hsl(var(--accent))",
          "foreground": "hsl(var(--accent-foreground))"
        },
        "popover": {
          "DEFAULT": "hsl(var(--popover))",
          "foreground": "hsl(var(--popover-foreground))"
        },
        "card": {
          "DEFAULT": "hsl(var(--card))",
          "foreground": "hsl(var(--card-foreground))"
        },
        "brand": {
          "a": "hsl(var(--brand-a))",
          "b": "hsl(var(--brand-b))",
          "c": "hsl(var(--brand-c))"
        },
        "sidebar": {
          "DEFAULT": "hsl(var(--sidebar-background))",
          "foreground": "hsl(var(--sidebar-foreground))",
          "primary": "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          "accent": "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          "border": "hsl(var(--sidebar-border))",
          "ring": "hsl(var(--sidebar-ring))"
        },
        "chart": {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))"
        }
      },
      "borderRadius": {
        "3xl": "calc(var(--radius) + 16px)",
        "2xl": "calc(var(--radius) + 8px)",
        "xl": "calc(var(--radius) + 4px)",
        "lg": "var(--radius)",
        "DEFAULT": "calc(var(--radius) - 2px)",
        "md": "calc(var(--radius) - 2px)",
        "sm": "calc(var(--radius) - 4px)"
      },
      "boxShadow": {
        "2xs": "var(--shadow-2xs)",
        "xs": "var(--shadow-xs)",
        "sm": "var(--shadow-sm)",
        "DEFAULT": "var(--shadow)",
        "md": "var(--shadow-md)",
        "lg": "var(--shadow-lg)",
        "xl": "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        "glow": "0 0 0 1px hsl(var(--primary) / 0.35), 0 12px 40px -12px hsl(var(--brand-a) / 0.45)",
        "glow-sm": "0 0 0 1px hsl(var(--primary) / 0.25), 0 6px 24px -8px hsl(var(--brand-a) / 0.4)"
      },
      "keyframes": {
        "shimmer": {
          "0%": { "background-position": "-200% 0" },
          "100%": { "background-position": "200% 0" }
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        },
        "aurora": {
          "0%, 100%": { transform: "translate(0, 0) scale(1)", opacity: "0.7" },
          "33%": { transform: "translate(4%, -6%) scale(1.06)", opacity: "0.9" },
          "66%": { transform: "translate(-4%, 4%) scale(0.97)", opacity: "0.6" }
        }
      },
      "animation": {
        "shimmer": "shimmer 2.4s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 2.4s ease-in-out infinite",
        "aurora": "aurora 14s ease-in-out infinite"
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default tailwindConfig;
