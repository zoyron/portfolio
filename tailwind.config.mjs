import defaultTheme from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        accent: "var(--accent)",
        "accent-glow": "var(--accent-glow)",
        card: "var(--card-bg)",
        "card-border": "var(--card-border)",
        subtle: "var(--subtle)",
        muted: "var(--muted)",
      },
      fontFamily: {
        "sans": ["Atkinson", ...defaultTheme.fontFamily.sans],
        "display": ["'Space Grotesk Variable'", ...defaultTheme.fontFamily.sans],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "full",
            color: "var(--foreground)",
            a: {
              color: "var(--accent)",
              '&:hover': {
                color: "var(--accent-glow)",
              },
            },
            strong: {
              color: "var(--foreground)",
            },
            h1: {
              color: "var(--foreground)",
              fontFamily: "'Space Grotesk Variable', sans-serif",
            },
            h2: {
              color: "var(--foreground)",
              fontFamily: "'Space Grotesk Variable', sans-serif",
            },
            h3: {
              color: "var(--foreground)",
              fontFamily: "'Space Grotesk Variable', sans-serif",
            },
            h4: {
              color: "var(--foreground)",
              fontFamily: "'Space Grotesk Variable', sans-serif",
            },
            code: {
              color: "var(--foreground)",
            },
            blockquote: {
              color: "var(--muted)",
              borderLeftColor: "var(--accent)",
            },
          },
        },
      },
      rotate: {
        "45": "45deg",
        "135": "135deg",
        "225": "225deg",
        "315": "315deg",
      },
      animation: {
        twinkle: "twinkle 2s ease-in-out forwards",
        meteor: "meteor 3s ease-in-out forwards",
      },
      keyframes: {
        twinkle: {
          "0%": { 
            opacity: 0, 
            transform: "rotate(0deg)" 
          },
          "50%": { 
            opacity: 1,
            transform: "rotate(180deg)" 
          },
          "100%": { 
            opacity: 0, 
            transform: "rotate(360deg)" 
          },
        },
        meteor: {
          "0%": { 
            opacity: 0, 
            transform: "translateY(200%)" 
          },
          "50%": { 
            opacity: 1  
          },
          "100%": { 
            opacity: 0, 
            transform: "translateY(0)" 
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
