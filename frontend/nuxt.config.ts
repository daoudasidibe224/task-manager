// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/icon",
    "@nuxt/ui",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  pinia: {
    storesDirs: ["~/stores/**"],
  },
  srcDir: "app/",
  runtimeConfig: {
    // Côté serveur (dans Docker)
    apiBaseUrl: process.env.NUXT_API_BASE_URL || "http://backend:3000/api",
    public: {
      // Côté client (navigateur)
      apiBaseUrl: "http://localhost:3000/api",
    },
  },
});
