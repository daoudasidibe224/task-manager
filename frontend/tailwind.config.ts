import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import aspectRatio from "@tailwindcss/aspect-ratio";

export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",
    "./nuxt.config.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées si besoin
      },
      gradientColorStops: {
        "primary-from": "#7C3AED",
        "primary-to": "#3B82F6",
      },
    },
  },
  plugins: [forms, typography, aspectRatio],
} satisfies Config;
