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
        canvas: "#f7f7f5", raised: "#ffffff", hairline: "#e2e4df",
        textPrimary: "#17211d", textSecondary: "#5e6963", textTertiary: "#87908a",
        twin: {
          bg: "#f7f7f5", card: "#ffffff", border: "#e2e4df", cyan: "#243b7a",
          indigo: "#455ca4", white: "#17211d", slate: "#5e6963", tertiary: "#87908a",
          success: "#237b4b", warning: "#946619", danger: "#b23a36",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
        sm: "2px",
        DEFAULT: "4px",
      },
      boxShadow: { panel: "0 1px 2px rgba(23, 33, 29, 0.04)" },
    },
  },
  plugins: [],
};
