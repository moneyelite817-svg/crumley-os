import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      colors: {
        os: {
          bg: "#03060f",
          surface: "#070d1a",
          card: "#0a1223",
          border: "rgba(255,255,255,0.06)",
          blue: "#1a6eff",
          gold: "#f0c040",
          green: "#00d084",
          red: "#ff4444",
          muted: "rgba(255,255,255,0.35)",
        },
        luxury: {
          bg: "#0d1628",
          surface: "#111e36",
          card: "#162040",
          border: "#1e2e50",
          accent: "#1a6eff",
        },
        coach: {
          bg: "#000000",
          surface: "#0a0a0a",
          card: "#111111",
          border: "#222222",
          accent: "#1a6eff",
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.4,0,0.2,1) forwards",
        "fade-in": "fade-in 0.4s ease forwards",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "float-orb": "float-orb 12s ease-in-out infinite",
        "shimmer": "shimmer 1.8s ease-in-out infinite",
        "scan-line": "scan-line 2s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "counter-spin": "counter-spin 15s linear infinite",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(26,110,255,0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(26,110,255,0.5)" },
        },
        "float-orb": {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(30px,-20px) scale(1.05)" },
          "66%": { transform: "translate(-20px,15px) scale(0.97)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "scan-line": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "90%": { opacity: "0.5" },
          "100%": { transform: "translateY(400%)", opacity: "0" },
        },
        "spin-slow": {
          "from": { transform: "rotate(0deg)" },
          "to": { transform: "rotate(360deg)" },
        },
        "counter-spin": {
          "from": { transform: "rotate(0deg)" },
          "to": { transform: "rotate(-360deg)" },
        },
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        "glass": "0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset",
        "glow-blue": "0 0 40px rgba(26,110,255,0.15), 0 4px 24px rgba(0,0,0,0.5)",
        "glow-gold": "0 0 40px rgba(240,192,64,0.1)",
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "20px",
        "4xl": "28px",
      },
    },
  },
  plugins: [],
};

export default config;
