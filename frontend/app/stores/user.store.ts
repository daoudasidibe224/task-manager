import { defineStore } from "pinia";
import { useAuthStore } from "./auth.store";
import type { User, UpdateUserDto } from "~/types";

interface UserState {
  selectedUser: User | null;
  loading: boolean;
  error: string | null;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    selectedUser: null,
    loading: false,
    error: null,
  }),

  actions: {
    async updateUser(id: string, data: UpdateUserDto) {
      this.loading = true;
      this.error = null;
      const { patch } = useApi();
      const { withNotifications } = useNotifications();
      const authStore = useAuthStore();

      try {
        const response = await withNotifications(
          () => patch<User>(`users/${id}`, { ...data }),
          { hideSuccess: false }
        );

        if (response?.success && response.data) {
          const updatedUser = response.data;
          this.selectedUser = updatedUser;

          // Si l'utilisateur mis à jour est l'utilisateur connecté,
          // on met aussi à jour le state dans le authStore.
          if (authStore.currentUser?.id === updatedUser.id) {
            authStore.user = updatedUser;
          }
          return updatedUser;
        }
      } catch (err) {
        this.error = "Erreur lors de la mise à jour de l'utilisateur.";
        throw err;
      } finally {
        this.loading = false;
      }
    },
  },
});
