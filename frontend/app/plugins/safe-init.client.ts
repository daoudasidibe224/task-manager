export default defineNuxtPlugin(() => {
  // Plugin pour nettoyer automatiquement les données corrompues au démarrage
  if (typeof window !== "undefined") {
    // Nettoyer les IDs corrompus connus
    const corruptedIds = ["cmckccd4w0002", "undefined", "null"];

    Object.keys(localStorage).forEach((key) => {
      try {
        const value = localStorage.getItem(key);
        if (value && corruptedIds.some((id) => value.includes(id))) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    });
  }
});
