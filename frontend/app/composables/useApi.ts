import type { ApiResponse } from "~/types";
import type { FetchOptions, FetchError } from "ofetch";
import { useRequestHeaders } from "nuxt/app";

// Variable globale pour éviter les refresh simultanés
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let lastRefreshAttempt = 0;
const REFRESH_COOLDOWN = 5000; // 5 secondes entre les tentatives de refresh

// Cache pour éviter de recréer apiFetch à chaque appel
let apiInstance: ReturnType<typeof $fetch.create> | null = null;

// Set pour performance (plus rapide que includes())
const AUTH_ENDPOINTS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
]);

// Type guard pour les erreurs Fetch
const isFetchError = (error: unknown): error is FetchError => {
  return typeof error === "object" && error !== null && "response" in error;
};

export const useApi = () => {
  const config = useRuntimeConfig();

  // URL appropriée selon le contexte (client vs serveur)
  const baseURL = import.meta.client
    ? (config.public.apiBaseUrl as string).replace("backend", "localhost")
    : config.public.apiBaseUrl;

  // Cookies côté serveur pour SSR
  const serverCookies = import.meta.server
    ? useRequestHeaders(["cookie"]).cookie
    : undefined;

  // Cache de l'authStore pour éviter les imports répétés
  let authStoreCache: ReturnType<
    typeof import("~/stores/auth.store").useAuthStore
  > | null = null;

  // Fonction pour tenter le refresh (avec gestion des appels simultanés)
  const attemptRefresh = async (): Promise<boolean> => {
    // Vérifier le cooldown pour éviter les tentatives trop fréquentes
    const now = Date.now();
    if (now - lastRefreshAttempt < REFRESH_COOLDOWN) {
      return false;
    }

    // Si un refresh est déjà en cours, attendre le résultat
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

    lastRefreshAttempt = now;
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        await $fetch("/auth/refresh", {
          method: "POST",
          baseURL,
          credentials: "include",
        });
        return true;
      } catch {
        // Déconnexion si refresh échoue
        if (import.meta.client) {
          if (!authStoreCache) {
            const { useAuthStore } = await import("~/stores/auth.store");
            authStoreCache = useAuthStore();
          }
          authStoreCache.forceLogout();
        }
        return false;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  // Vérification optimisée des endpoints d'auth
  const isAuthEndpoint = (url: string): boolean => {
    return AUTH_ENDPOINTS.has(new URL(url, baseURL).pathname);
  };

  // Fonction wrapper avec retry automatique
  const withAutoRetry = async <T>(
    requestFn: () => Promise<T>,
    url: string
  ): Promise<T> => {
    try {
      // Tentative initiale
      const result = await requestFn();

      // Protection supplémentaire : s'assurer qu'on a une réponse valide
      if (!result || typeof result !== "object") {
        // Créer une réponse fallback pour éviter les crashes
        return {
          success: true,
          message: "Opération réussie",
          timestamp: new Date().toISOString(),
        } as T;
      }

      return result;
    } catch (error: unknown) {
      // Vérification type-safe de l'erreur
      if (
        isFetchError(error) &&
        error.response?.status === 401 &&
        !isAuthEndpoint(url)
      ) {
        // Tenter le refresh
        const refreshSuccess = await attemptRefresh();

        if (refreshSuccess) {
          // Retry la requête originale
          const result = await requestFn();

          // Protection supplémentaire sur le retry aussi
          if (!result || typeof result !== "object") {
            return {
              success: true,
              message: "Opération réussie",
              timestamp: new Date().toISOString(),
            } as T;
          }

          return result;
        } else {
          throw error;
        }
      }

      // Re-throw l'erreur si pas 401 ou si refresh pas possible
      throw error;
    }
  };

  // Instance API singleton pour performance
  if (!apiInstance) {
    apiInstance = $fetch.create({
      baseURL,
      credentials: "include",
      timeout: 10000, // Timeout réduit à 10 secondes
      retry: 0, // Pas de retry automatique pour éviter les boucles
      headers: {
        "Content-Type": "application/json",
        ...(serverCookies ? { cookie: serverCookies } : {}),
      },
    });
  }

  return {
    get: <T = unknown>(url: string, options?: Omit<FetchOptions, "method">) =>
      withAutoRetry(
        () => apiInstance!<ApiResponse<T>>(url, { ...options, method: "GET" }),
        url
      ),

    post: <T = unknown>(
      url: string,
      body?: Record<string, unknown>,
      options?: Omit<FetchOptions, "method" | "body">
    ) =>
      withAutoRetry(
        () =>
          apiInstance!<ApiResponse<T>>(url, {
            ...options,
            method: "POST",
            body,
          }),
        url
      ),

    patch: <T = unknown>(
      url: string,
      body?: Record<string, unknown>,
      options?: Omit<FetchOptions, "method" | "body">
    ) =>
      withAutoRetry(
        () =>
          apiInstance!<ApiResponse<T>>(url, {
            ...options,
            method: "PATCH",
            body,
          }),
        url
      ),

    put: <T = unknown>(
      url: string,
      body?: Record<string, unknown>,
      options?: Omit<FetchOptions, "method" | "body">
    ) =>
      withAutoRetry(
        () =>
          apiInstance!<ApiResponse<T>>(url, {
            ...options,
            method: "PUT",
            body,
          }),
        url
      ),

    del: <T = unknown>(url: string, options?: Omit<FetchOptions, "method">) =>
      withAutoRetry(
        () =>
          apiInstance!<ApiResponse<T>>(url, { ...options, method: "DELETE" }),
        url
      ),
  };
};
