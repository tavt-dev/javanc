import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#667085",
        line: "#d9e1ec",
        panel: "#ffffff",
        canvas: "#f5f7fb",
        brand: "#1b6b93",
        accent: "#2d9a69",
        warn: "#c86b2c",
        danger: "#b42318"
      },
      boxShadow: {
        soft: "0 16px 48px rgba(23, 32, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
