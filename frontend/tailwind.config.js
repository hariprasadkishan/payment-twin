/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f8f9fa",
        surface: "#ffffff",
        subtle: "#f1f3f5",
        hairline: "#e5e7eb",
        borderStrong: "#d1d5db",
        textPrimary: "#111827",
        textSecondary: "#4b5563",
        textTertiary: "#9ca3af",
        accent: {
          DEFAULT: "#1e3a8a",
          hover: "#172554",
          subtle: "#eff6ff",
        },
        twin: {
          bg: "#f8f9fa",
          card: "#ffffff",
          border: "#e5e7eb",
          cyan: "#1e3a8a",
          indigo: "#2563eb",
          white: "#111827",
          slate: "#4b5563",
          tertiary: "#9ca3af",
          success: "#059669",
          warning: "#d97706",
          danger: "#dc2626",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
        md: "6px",
        sm: "4px",
        DEFAULT: "6px",
      },
      boxShadow: {
        panel: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        dropdown: "0 4px 12px rgba(0, 0, 0, 0.08)",
        drawer: "-4px 0 24px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};
