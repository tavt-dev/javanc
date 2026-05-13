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
        ink: "#10103a",
        muted: "#7b7895",
        line: "#dedcf0",
        panel: "#ffffff",
        canvas: "#17163c",
        brand: "#6f63d8",
        accent: "#ffdc5d",
        warn: "#b97835",
        danger: "#b42318"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(8, 8, 32, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
