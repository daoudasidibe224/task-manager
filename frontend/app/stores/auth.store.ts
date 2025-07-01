import { defineStore } from "pinia";
import type { User, LoginDto, RegisterDto, AuthState } from "~/types";

export const useAuthStore = defineStore("auth", {
  state: (): Omit<AuthState, "accessToken"> & {
    profileLoaded: boolean;
  } => ({
    user: null,
    loading: false,
    error: null,
    profileLoaded: false,
  }),

  getters: {
    isAuthenticated: (state): boolean => !!state.user,
    currentUser: (state): User | null => state.user,
    isLoading: (state): boolean => state.loading,
    authError: (state) => state.error,
  },

  actions: {
    async login(credentials: LoginDto, redirect?: string) {
      this.loading = true;
      this.error = null;
      const { post } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => post<{ user: User }>("auth/login", { ...credentials }),
          { hideSuccess: true } // On gère le succès manuellement
        );

        if (response?.success && response.data?.user) {
          this.user = response.data.user;
          await nextTick();
          await navigateTo(redirect || "/dashboard", { replace: true });
        } else {
          throw new Error(response?.message || "La connexion a échoué.");
        }
      } catch (err) {
        this.error = "Une erreur est survenue lors de la connexion.";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(userInfo: RegisterDto) {
      this.loading = true;
      this.error = null;
      const { post } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => post<null>("auth/register", { ...userInfo }),
          { hideSuccess: true } // On gère le succès manuellement
        );

        if (response?.success) {
          const { success } = useNotifications();
          await navigateTo("/login");
          success(
            response.message ||
              "Inscription réussie ! Vous pouvez maintenant vous connecter."
          );
        } else {
          throw new Error(response?.message || "L'inscription a échoué.");
        }
      } catch (err) {
        this.error = "Une erreur est survenue lors de l'inscription.";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async fetchProfile() {
      if (this.profileLoaded && this.user) return;

      if (this.user && !this.profileLoaded) {
        this.profileLoaded = true;
        this.refreshProfileSilently();
        return;
      }

      this.loading = true;
      this.error = null;
      const { get } = useApi();

      try {
        const response = await get<{ user: User }>("auth/profile");
        if (response?.success && response.data?.user) {
          this.user = response.data.user;
          this.profileLoaded = true;
        } else {
          // Si l'API répond mais sans user, on considère que l'utilisateur n'est pas authentifié
          this.user = null;
          this.profileLoaded = true;
        }
      } catch {
        if (!this.user) {
          this.user = null;
        }
        this.profileLoaded = true;
      } finally {
        this.loading = false;
      }
    },

    async refreshProfileSilently() {
      const { get } = useApi();
      try {
        const response = await get<{ user: User }>("auth/profile");
        if (response?.success && response.data?.user) {
          this.user = response.data.user;
        }
      } catch {
        // Ignore l'erreur pour le rafraîchissement silencieux
      }
    },

    async refreshTokens(): Promise<boolean> {
      const { post } = useApi();

      try {
        const response = await post<{ user: User }>("auth/refresh");

        if (response?.success && response.data?.user) {
          this.user = response.data.user;
          this.error = null;
          return true;
        } else {
          return false;
        }
      } catch {
        this.forceLogout();
        return false;
      }
    },

    async logout() {
      this.loading = true;
      const { post } = useApi();
      const { withNotifications, success } = useNotifications();

      try {
        await withNotifications(
          () => post("auth/logout"),
          { hideSuccess: true } // On gère le succès manuellement
        );
        success("Vous avez été déconnecté avec succès.");
      } catch {
        success("Vous avez été déconnecté.");
      } finally {
        this.forceLogout();
      }
    },

    forceLogout() {
      this.user = null;
      this.profileLoaded = false;
      this.loading = false;
      this.error = null;
      navigateTo("/login");
    },

    resetError() {
      this.error = null;
    },
  },

  persist: {
    pick: ["user", "profileLoaded"],
  },
});
