import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Layout classes generated at runtime — must be safelisted so Tailwind doesn't purge them
  safelist: [
    // Sidebar (52px) + no panel
    "lg:ml-[52px]",
    "lg:w-[calc(100%-52px)]",
    "lg:left-[52px]",
    // Sidebar (52px) + default panel (224px)
    "lg:ml-[calc(52px+224px)]",
    "lg:w-[calc(100%-52px-224px)]",
    "lg:left-[calc(52px+224px)]",
    // Sidebar (52px) + routes panel (320px)
    "lg:ml-[calc(52px+320px)]",
    "lg:w-[calc(100%-52px-320px)]",
    "lg:left-[calc(52px+320px)]",
    "lg:right-0",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        "lav":        "var(--lav)",
        "lav-dim":    "var(--lav-dim)",
        "lav-mid":    "var(--lav-mid)",
        "lav-border": "var(--lav-border)",
        // Backgrounds
        "bg":         "var(--bg)",
        "bg-2":       "var(--bg-2)",
        "bg-3":       "var(--bg-3)",
        "void-100":   "var(--void-100)",
        // Accent signals
        "energy":     "var(--energy)",
        "royal-600":  "var(--royal-600)",
        // Foreground
        "fg":         "var(--fg)",
        "muted":      "var(--muted)",
        "muted-2":    "var(--muted-2)",
        "muted-3":    "var(--muted-3)",
        "mut2":       "var(--mut2)",
        "mut3":       "var(--mut3)",
        "mut4":       "var(--mut4)",
        // Overlays
        "overlay-10":  "var(--overlay-10)",
        "backdrop-50": "var(--backdrop-50)",
        // Semantic
        "success":    "var(--success)",
        "warning":    "var(--warning)",
        "danger":     "var(--danger)",
        "info":       "var(--info)",
        "ok":         "var(--ok)",
        "warn-c":     "var(--warn-c)",
      },
      spacing: {
        "sp-1":  "var(--sp-1)",
        "sp-2":  "var(--sp-2)",
        "sp-3":  "var(--sp-3)",
        "sp-4":  "var(--sp-4)",
        "sp-5":  "var(--sp-5)",
        "sp-6":  "var(--sp-6)",
        "sp-8":  "var(--sp-8)",
        "sp-10": "var(--sp-10)",
        "sp-12": "var(--sp-12)",
        "sp-16": "var(--sp-16)",
        "sp-20": "var(--sp-20)",
        "touch": "var(--touch-min)",
      },
      fontFamily: {
        display: ["var(--f-display)"],
        body:    ["var(--f-body)"],
      },
      fontSize: {
        "f-xxs":  "var(--f-xxs)",
        "f-xs":   "var(--f-xs)",
        "f-sm":   "var(--f-sm)",
        "f-md":   "var(--f-md)",
        "f-base": "var(--f-base)",
        "f-lg":   "var(--f-lg)",
        "f-xl":   "var(--f-xl)",
        "f-2xl":  "var(--f-2xl)",
      },
    },
  },
  plugins: [],
};

export default config;
