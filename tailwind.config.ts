import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        scout: {
          blue: "#1D4ED8",
          "blue-dark": "#1E3A8A",
          green: "#16A34A",
          amber: "#D97706",
          red: "#DC2626",
          slate: "#1E293B",
          "slate-light": "#334155",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
