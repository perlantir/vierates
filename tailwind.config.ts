import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0E1626",
        "ink-90": "#1B2436",
        "ink-80": "#28324A",
        bone: "#F6F7F4",
        paper: "#FFFFFF",
        paddle: "#F2A30F",
        slate: "#5A6478",
        "slate-weak": "#8A92A1",
        funded: "#177E63",
        signal: "#C9303D",
        line: "#E3E5E0",
        "line-strong": "#CFD2CC",
        "ink-line": "#2A3450",
        "ink-raised": "#19223A",
        "on-ink": "#EEF1F6",
        "on-ink-dim": "#9AA4B8",
      },
      fontFamily: {
        display: ["var(--font-bricolage)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        ui: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
