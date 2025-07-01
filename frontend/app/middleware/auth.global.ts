import { useAuthStore } from "~/stores/auth.store";

export default defineNuxtRouteMiddleware(async (to) => {
  try {
    const authStore = useAuthStore();

    // Éviter les boucles infinies
    if (to.path === "/login" && to.query.redirect === "/login") {
      return;
    }

    const publicRoutes = ["/login", "/register"];
    const isPublic = publicRoutes.includes(to.path);

    // Pour les routes publiques, vérifier uniquement si l'utilisateur est authentifié
    if (isPublic) {
      if (authStore.isAuthenticated) {
        return navigateTo("/dashboard", { replace: true });
      }
      return;
    }

    // Pour les routes privées, charger le profil si nécessaire
    if (!authStore.isAuthenticated) {
      if (!authStore.profileLoaded && !authStore.profileLoading) {
        try {
          await authStore.fetchProfile();
        } catch {
          // Ignorer l'erreur, fetchProfile gère déjà l'état
        }
      }

      // Si toujours pas authentifié après fetchProfile
      if (!authStore.isAuthenticated) {
        const redirect = to.fullPath !== "/" ? to.fullPath : undefined;
        return navigateTo(
          {
            path: "/login",
            query: redirect ? { redirect } : undefined,
          },
          { replace: true }
        );
      }
    }

    // Cas particulier de la page racine
    if (to.path === "/") {
      return navigateTo(authStore.isAuthenticated ? "/dashboard" : "/login", {
        replace: true,
      });
    }
  } catch {
    // En cas d'erreur critique, rediriger vers login de manière sûre
    if (to.path !== "/login") {
      return navigateTo("/login", { replace: true });
    }
  }
});
