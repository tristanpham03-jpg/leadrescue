import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        rescue: {
          50: "#effdf7",
          100: "#d9fbee",
          500: "#12b981",
          600: "#0f9f73",
          700: "#0d7f5f"
        },
        signal: "#f59e0b"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(17, 24, 39, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
