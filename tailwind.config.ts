import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        kia: {
          red: "#BB162B",
          "red-dark": "#8B0E1E",
          navy: "#05141F",
          "navy-light": "#0D2535",
          silver: "#C8C9C7",
          white: "#FFFFFF",
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
