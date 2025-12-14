import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主题颜色
        primary: {
          DEFAULT: "var(--primary-color)",
          hover: "var(--primary-hover)",
        },
        danger: {
          DEFAULT: "var(--danger-color)",
        },
        success: {
          DEFAULT: "var(--success-color)",
        },
        warning: {
          DEFAULT: "var(--warning-color)",
        },
        // 文本颜色
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
        },
        // 背景颜色
        bg: {
          card: "var(--card-background)",
          page: "var(--background-color)",
        },
        // 边框颜色
        border: {
          DEFAULT: "var(--border-color)",
        },
      },
      borderRadius: {
        DEFAULT: "var(--border-radius)",
        large: "var(--border-radius-large)",
      },
      boxShadow: {
        light: "var(--shadow-light)",
        medium: "var(--shadow-medium)",
        heavy: "var(--shadow-heavy)",
      },
    },
  },
  plugins: [],
};

export default config;

