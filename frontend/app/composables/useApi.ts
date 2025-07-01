import type { ApiResponse } from "~/types";
import type { FetchOptions, FetchError } from "ofetch";
import { useRequestHeaders } from "nuxt/app";

// Variable globale pour éviter les refresh simultanés
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Set pour performance
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

  // URL appropriée selon le contexte
  const baseURL = import.meta.client
    ? (config.public.apiBaseUrl as string).replace("backend", "localhost")
    : config.public.apiBaseUrl;

  // Cookies côté serveur pour SSR
  const serverCookies = import.meta.server
    ? useRequestHeaders(["cookie"]).cookie
    : undefined;

  // Fonction pour tenter le refresh
  const attemptRefresh = async (): Promise<boolean> => {
    if (isRefreshing && refreshPromise) {
      return refreshPromise;
    }

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
        if (import.meta.client) {
          await navigateTo("/login");
        }
        return false;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    return refreshPromise;
  };

  // Vérification des endpoints d'auth
  const isAuthEndpoint = (url: string): boolean => {
    return AUTH_ENDPOINTS.has(new URL(url, baseURL).pathname);
  };

  // Instance API créée à la demande
  const createApiInstance = () => {
    return $fetch.create({
      baseURL,
      credentials: "include",
      timeout: 15000,
      retry: 0,
      headers: {
        "Content-Type": "application/json",
        ...(serverCookies ? { cookie: serverCookies } : {}),
      },
    });
  };

  // Fonction wrapper avec retry automatique
  const withAutoRetry = async <T>(
    requestFn: () => Promise<T>,
    url: string
  ): Promise<T> => {
    try {
      return await requestFn();
    } catch (error: unknown) {
      if (
        isFetchError(error) &&
        error.response?.status === 401 &&
        !isAuthEndpoint(url)
      ) {
        const refreshSuccess = await attemptRefresh();
        if (refreshSuccess) {
          return await requestFn();
        }
      }
      throw error;
    }
  };

  const api = createApiInstance();

  return {
    get: <T = unknown>(url: string, options?: Omit<FetchOptions, "method">) =>
      withAutoRetry(
        () => api<ApiResponse<T>>(url, { ...options, method: "GET" }),
        url
      ),

    post: <T = unknown>(
      url: string,
      body?: Record<string, unknown>,
      options?: Omit<FetchOptions, "method" | "body">
    ) =>
      withAutoRetry(
        () =>
          api<ApiResponse<T>>(url, {
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
          api<ApiResponse<T>>(url, {
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
          api<ApiResponse<T>>(url, {
            ...options,
            method: "PUT",
            body,
          }),
        url
      ),

    del: <T = unknown>(url: string, options?: Omit<FetchOptions, "method">) =>
      withAutoRetry(
        () => api<ApiResponse<T>>(url, { ...options, method: "DELETE" }),
        url
      ),
  };
};
