import type { ApiResponse } from "~/types";

export interface NotificationOptions {
  title?: string;
  description?: string;
  timeout?: number;
  color?:
    | "success"
    | "error"
    | "warning"
    | "info"
    | "primary"
    | "secondary"
    | "neutral";
  icon?: string;
}

// Type guard pour les erreurs Fetch
const isFetchError = (
  error: unknown
): error is {
  response?: unknown;
  statusCode?: number;
  message?: string;
  name?: string;
} => {
  return typeof error === "object" && error !== null && "response" in error;
};

export const useNotifications = () => {
  const toast = useToast();

  /**
   * Affiche une notification de succès
   */
  const success = (
    message: string,
    options: Partial<NotificationOptions> = {}
  ) => {
    toast.add({
      title: options.title || "Succès",
      description: message,
      color: "success",
      icon: "i-heroicons-check-circle",
      timeout: options.timeout || 5000,
      ...options,
    });
  };

  /**
   * Affiche une notification d'erreur
   */
  const error = (
    message: string,
    options: Partial<NotificationOptions> = {}
  ) => {
    toast.add({
      title: options.title || "Erreur",
      description: message,
      color: "error",
      icon: "i-heroicons-x-circle",
      timeout: options.timeout || 7000,
      ...options,
    });
  };

  /**
   * Extrait le message d'erreur d'une erreur de fetch
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const extractErrorMessage = async (fetchError: any): Promise<string> => {
    try {
      // Essayer de récupérer la réponse JSON du backend
      if (fetchError.response) {
        const errorData =
          (await fetchError.response.json()) as ApiResponse<unknown>;
        if (errorData && errorData.message) {
          return errorData.message;
        }
      }
    } catch {
      // Si on ne peut pas parser la réponse, continuer avec les fallbacks
    }

    // Gestion spécifique des erreurs de timeout
    if (
      fetchError.name === "TimeoutError" ||
      fetchError.message?.includes("timeout")
    ) {
      return "La requête a pris trop de temps à répondre. Veuillez réessayer.";
    }

    // Gestion spécifique des erreurs de réseau
    if (
      fetchError.name === "NetworkError" ||
      fetchError.message?.includes("network") ||
      fetchError.message?.includes("fetch")
    ) {
      return "Problème de connexion réseau. Vérifiez votre connexion internet.";
    }

    // Fallback sur les messages d'erreur standards par code de statut
    if (fetchError.statusCode === 400) {
      return "Données invalides. Merci de vérifier les champs du formulaire.";
    }
    if (fetchError.statusCode === 401) {
      return "Email ou mot de passe incorrect";
    }
    if (fetchError.statusCode === 403) {
      return "Accès interdit";
    }
    if (fetchError.statusCode === 404) {
      return "Ressource non trouvée";
    }
    if (fetchError.statusCode === 409) {
      return "Cet email est déjà utilisé";
    }
    if (fetchError.statusCode === 500) {
      return "Erreur interne du serveur";
    }
    if (
      fetchError.statusCode === 502 ||
      fetchError.statusCode === 503 ||
      fetchError.statusCode === 504
    ) {
      return "Le serveur est temporairement indisponible. Veuillez réessayer dans quelques instants.";
    }

    return fetchError.message || "Une erreur inattendue s'est produite";
  };

  /**
   * Traite une erreur d'API et affiche la notification appropriée
   */
  const handleApiError = async (err: unknown): Promise<never> => {
    let errorMessage = "Une erreur inattendue s'est produite";

    if (isFetchError(err)) {
      errorMessage = await extractErrorMessage(err);
    } else if (err instanceof Error) {
      errorMessage = err.message;
    }

    error(errorMessage);
    throw err;
  };

  /**
   * Wrapper pour les appels d'API avec gestion automatique des notifications
   */
  const withNotifications = async <T>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: {
      successMessage?: string;
      hideSuccess?: boolean;
      hideError?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> => {
    try {
      const response = await apiCall();

      // Protection contre les réponses undefined ou null
      if (!response || typeof response !== "object") {
        const fallbackResponse: ApiResponse<T> = {
          success: true,
          message: options.successMessage || "Opération réussie",
          timestamp: new Date().toISOString(),
        };

        if (!options.hideSuccess) {
          success(fallbackResponse.message);
        }

        return fallbackResponse;
      }

      // Si on arrive ici, c'est que l'appel HTTP a réussi (200, 201, etc.)
      if (response.success && !options.hideSuccess) {
        const message =
          options.successMessage || response.message || "Opération réussie";
        success(message);
      } else if (!response.success && !options.hideError) {
        // Cas où le HTTP a réussi mais l'opération a échoué selon la logique métier
        const errorMsg =
          response.errors &&
          Array.isArray(response.errors) &&
          response.errors.length > 0
            ? response.errors.join(", ")
            : response.message || "Une erreur est survenue";
        error(errorMsg);
      }

      return response;
    } catch (err) {
      if (!options.hideError) {
        await handleApiError(err);
      }
      throw err;
    }
  };

  return {
    success,
    error,
    withNotifications,
  };
};
