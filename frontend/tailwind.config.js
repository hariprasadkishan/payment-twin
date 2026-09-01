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
        twin: {
          bg: "#080B11",
          card: "#0F1422",
          border: "#1C2538",
          cyan: "#06B6D4",
          indigo: "#6366F1",
          white: "#F8FAFC",
          slate: "#94A3B8",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        xl: "12px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
