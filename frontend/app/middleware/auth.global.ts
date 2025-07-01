import { useAuthStore } from "~/stores/auth.store";

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  // S'assurer que le profil est chargé avant de faire les vérifications
  if (!authStore.profileLoaded) {
    await authStore.fetchProfile();
  }

  const publicRoutes = ["/login", "/register"];
  const isPublic = publicRoutes.includes(to.path);

  // Utilisateur authentifié → empêcher l'accès aux pages publiques
  if (authStore.isAuthenticated && isPublic) {
    return navigateTo("/dashboard", { replace: true });
  }

  // Utilisateur non authentifié → protéger les pages privées
  if (!authStore.isAuthenticated && !isPublic) {
    const redirect = to.fullPath !== "/" ? to.fullPath : undefined;
    return navigateTo(
      {
        path: "/login",
        query: redirect ? { redirect } : undefined,
      },
      { replace: true }
    );
  }

  // Cas particulier de la page racine
  if (to.path === "/") {
    return navigateTo(authStore.isAuthenticated ? "/dashboard" : "/login", {
      replace: true,
    });
  }
});
