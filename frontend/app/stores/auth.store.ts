import { defineStore } from "pinia";
import type { User, LoginDto, RegisterDto, AuthState } from "~/types";
import { toRaw } from "vue";

interface AuthStoreState extends Omit<AuthState, "accessToken"> {
  profileLoaded: boolean;
  profileLoading: boolean;
}

export const useAuthStore = defineStore("auth", () => {
  const state = reactive<AuthStoreState>({
    user: null,
    loading: false,
    error: null,
    profileLoaded: false,
    profileLoading: false,
  });

  const isAuthenticated = computed(() => !!state.user);
  const currentUser = computed(() => state.user);
  const isLoading = computed(() => state.loading);

  async function login(credentials: LoginDto, redirect?: string) {
    state.loading = true;
    state.error = null;
    const { post } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const rawCredentials = toRaw(credentials) as LoginDto;
      const response = await withNotifications(
        () => post<{ user: User }>("auth/login", { ...rawCredentials }),
        { hideSuccess: true }
      );

      if (response?.success && response.data?.user) {
        state.user = response.data.user;
        state.profileLoaded = true;
        await nextTick();
        await navigateTo(redirect || "/dashboard", { replace: true });
      } else {
        throw new Error(response?.message || "La connexion a échoué.");
      }
    } catch (err) {
      state.error = "Une erreur est survenue lors de la connexion.";
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function register(userInfo: RegisterDto) {
    state.loading = true;
    state.error = null;
    const { post } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const rawInfo = toRaw(userInfo) as RegisterDto;
      const response = await withNotifications(
        () => post<null>("auth/register", { ...rawInfo }),
        { hideSuccess: true }
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
      state.error = "Une erreur est survenue lors de l'inscription.";
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function fetchProfile() {
    if (state.profileLoading || state.profileLoaded) {
      return;
    }

    state.profileLoading = true;
    state.error = null;
    const { get } = useApi();

    try {
      const response = await get<{ user: User }>("auth/profile");
      if (response?.success && response.data?.user) {
        state.user = response.data.user;
        state.profileLoaded = true;
      } else {
        state.user = null;
        state.profileLoaded = true;
      }
    } catch {
      state.user = null;
      state.profileLoaded = true;
    } finally {
      state.profileLoading = false;
    }
  }

  async function logout() {
    state.loading = true;
    const { post } = useApi();
    const { withNotifications, success } = useNotifications();

    try {
      await withNotifications(() => post("auth/logout"), { hideSuccess: true });
      success("Vous avez été déconnecté avec succès.");
    } catch {
      success("Vous avez été déconnecté.");
    } finally {
      forceLogout();
    }
  }

  function forceLogout() {
    state.user = null;
    state.profileLoaded = false;
    state.profileLoading = false;
    state.loading = false;
    state.error = null;
    navigateTo("/login");
  }

  return {
    ...toRefs(state),
    isAuthenticated,
    currentUser,
    isLoading,
    login,
    register,
    fetchProfile,
    logout,
    forceLogout,
    $persist: {
      pick: ["user"],
    },
  };
});
