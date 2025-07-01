import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import type { Pinia } from "pinia";

export default defineNuxtPlugin((nuxtApp) => {
  const pinia = nuxtApp.$pinia as Pinia;
  if (pinia) {
    pinia.use(piniaPluginPersistedstate);
  }
});
