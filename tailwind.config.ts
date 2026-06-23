import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#1b8de0",
          bluedark: "#0f5fa6",
          green: "#5cc524",
          greendark: "#3f9c12",
          ink: "#0d1b2a",
          ink2: "#16263a",
          mist: "#f5f8fb",
          line: "#e4ebf2"
        }
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 10px 40px -12px rgba(13, 27, 42, 0.18)",
        card: "0 4px 24px -8px rgba(13, 27, 42, 0.12)",
        glow: "0 12px 50px -10px rgba(27, 141, 224, 0.35)"
      },
      borderRadius: {
        xl2: "1.25rem"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.8s ease both",
        float: "float 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
