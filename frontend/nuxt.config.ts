export default defineNuxtConfig({
  buildDir: process.env.NUXT_BUILD_DIR || ".nuxt",
  compatibilityDate: "2026-10-08",
  devtools: { enabled: false },
  ssr: false,
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  typescript: { strict: true },
  runtimeConfig: { public: { apiBaseUrl: "http://127.0.0.1:8012/api" } },
  fonts: {
    providers: {
      google: false,
      bunny: false,
      fontshare: false,
      fontsource: false,
      adobe: false,
    },
  },
  colorMode: { preference: "light" },
  app: {
    head: {
      title: "Mes listes de tâches",
      htmlAttrs: { lang: "fr" },
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
      meta: [
        {
          name: "description",
          content:
            "Organisez vos tâches privées par liste, priorité et échéance.",
        },
      ],
    },
  },
});
