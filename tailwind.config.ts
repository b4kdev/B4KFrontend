import type { Config } from "tailwindcss";
import b4kTokens from "./tokens/tailwind-preset";

const config: Config = {
  // New design tokens from B4K UI Foundations (generated: npm run tokens:build)
  presets: [b4kTokens],
  // dark: variants follow the app theme (<html data-theme="dark">), not the OS setting.
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./.storybook/**/*.{ts,tsx}",
  ],
  plugins: [],
};

export default config;
