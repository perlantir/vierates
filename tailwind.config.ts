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
        ink: "var(--ink-800)",
        "ink-900": "var(--ink-900)",
        "ink-800": "var(--ink-800)",
        "ink-700": "var(--ink-700)",
        "ink-600": "var(--ink-600)",
        "ink-90": "var(--text)",
        "ink-80": "var(--ink-700)",
        bone: "var(--paper)",
        paper: "var(--card)",
        paddle: "var(--paddle)",
        "paddle-deep": "var(--paddle-deep)",
        "paddle-tint": "var(--paddle-tint)",
        slate: "var(--text-muted)",
        "slate-weak": "var(--text-faint)",
        funded: "var(--verified)",
        "funded-tint": "var(--verified-tint)",
        signal: "var(--alert)",
        "signal-tint": "var(--alert-tint)",
        info: "var(--info)",
        "info-tint": "var(--info-tint)",
        caution: "var(--caution)",
        "caution-tint": "var(--caution-tint)",
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
        "ink-line": "var(--ink-600)",
        "ink-raised": "var(--ink-700)",
        "on-ink": "var(--on-ink)",
        "on-ink-dim": "var(--on-ink-dim)",
      },
      fontFamily: {
        display: ["var(--font-plex-serif)", "Georgia", "serif"],
        serif: ["var(--font-plex-serif)", "Georgia", "serif"],
        sans: ["var(--font-plex-sans)", "Arial", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        ui: "8px",
        button: "10px",
        card: "14px",
      },
    },
  },
  plugins: [],
};

export default config;
