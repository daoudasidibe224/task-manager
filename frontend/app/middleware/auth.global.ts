import { useAuthStore } from "~/stores/auth.store";

let initialProfileFetch: Promise<void> | null = null;

export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore();

  // Sur le serveur, on ne fait rien pour laisser le client gérer la logique.
  if (process.server) {
    return;
  }

  if (!initialProfileFetch) {
    initialProfileFetch = authStore.fetchProfile();
  }
  await initialProfileFetch;

  const { isAuthenticated } = authStore;
  const publicRoutes = ["/login", "/register"];
  const isPublic = publicRoutes.includes(to.path);

  // Rediriger vers le dashboard si l'utilisateur est connecté
  if (isAuthenticated && isPublic) {
    return navigateTo("/dashboard", { replace: true });
  }

  // Rediriger vers login si l'utilisateur n'est pas connecté
  if (!isAuthenticated && !isPublic) {
    const redirect = to.fullPath !== "/" ? to.fullPath : undefined;
    return navigateTo(
      { path: "/login", query: redirect ? { redirect } : undefined },
      { replace: true }
    );
  }

  // Gérer le cas de la page racine.
  if (to.path === "/") {
    return navigateTo(isAuthenticated ? "/dashboard" : "/login", {
      replace: true,
    });
  }
});
