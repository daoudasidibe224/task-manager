export default defineNuxtPlugin(() => {
  // Supprimer les warnings de développement non critiques
  if (import.meta.dev) {
    const originalWarn = console.warn;
    const originalError = console.error;

    const shouldIgnore = (msg: unknown) => {
      if (typeof msg !== "string") return false;

      // Ignorer les warnings/erreurs UApp
      if (msg.includes("UApp")) return true;

      // Ignorer les messages d'hydratation non critiques
      if (msg.includes("Hydration") && msg.includes("mismatch")) return true;

      // Ignorer les warnings de slots
      if (msg.includes("slot") && msg.includes("default")) return true;

      // Ignorer les warnings de composants non enregistrés
      if (msg.includes("Failed to resolve component")) return true;

      return false;
    };

    console.warn = (...args) => {
      if (shouldIgnore(args[0])) return;
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      if (shouldIgnore(args[0])) return;
      originalError.apply(console, args);
    };
  }
});
