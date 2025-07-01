import { defineStore } from "pinia";
import { nextTick } from "vue";
import { useTaskStore } from "./task.store";
import type { TaskList, CreateTaskListDto, UpdateTaskListDto } from "~/types";

interface TaskListState {
  taskLists: TaskList[];
  selectedTaskList: TaskList | null;
  loading: boolean;
  error: string | null;
}

export const useTaskListStore = defineStore("taskList", {
  state: (): TaskListState => ({
    taskLists: [],
    selectedTaskList: null,
    loading: false,
    error: null,
  }),

  getters: {
    lists: (state) => state.taskLists,
    selected: (state) => state.selectedTaskList,
  },

  actions: {
    async fetchAllTaskLists() {
      this.loading = true;
      this.error = null;
      const { get } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => get<TaskList[]>("task-lists"),
          { hideSuccess: true }
        );
        if (response?.success && response.data) {
          this.taskLists = response.data;
        }
      } catch {
        this.error = "Erreur lors de la récupération des listes de tâches.";
        this.taskLists = [];
      } finally {
        this.loading = false;
      }
    },

    async fetchTaskListById(id: string) {
      this.loading = true;
      this.error = null;
      const { get } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => get<TaskList>(`task-lists/${id}`),
          { hideSuccess: true }
        );
        if (response?.success && response.data) {
          this.selectedTaskList = response.data;
        }
      } catch {
        this.error = "Erreur lors de la récupération de la liste de tâches.";
      } finally {
        this.loading = false;
      }
    },

    async createTaskList(data: CreateTaskListDto) {
      this.loading = true;
      this.error = null;
      const { post } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => post<TaskList>("task-lists", { ...data }),
          { hideSuccess: false }
        );

        if (response?.success && response.data) {
          this.taskLists.push(response.data);
          return response.data;
        }
      } catch (err) {
        this.error = "Erreur lors de la création de la liste de tâches.";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateTaskList(id: string, data: UpdateTaskListDto) {
      this.loading = true;
      this.error = null;
      const { patch } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => patch<TaskList>(`task-lists/${id}`, { ...data }),
          { hideSuccess: false }
        );

        if (response?.success && response.data) {
          const updatedList = response.data;
          const index = this.taskLists.findIndex((list) => list.id === id);
          if (index !== -1) {
            this.taskLists[index] = updatedList;
          }
          if (this.selectedTaskList?.id === id) {
            this.selectedTaskList = updatedList;
          }
          return updatedList;
        }
      } catch (err) {
        this.error = "Erreur lors de la mise à jour de la liste de tâches.";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteTaskList(id: string) {
      this.loading = true;
      this.error = null;
      const { del } = useApi();
      const { withNotifications } = useNotifications();
      const taskStore = useTaskStore();

      // Suppression optimiste - supprimer de l'interface immédiatement
      const originalLists = [...this.taskLists];
      const originalSelected = this.selectedTaskList;

      // Mise à jour optimiste de l'interface
      this.taskLists = this.taskLists.filter((list) => list.id !== id);
      if (this.selectedTaskList?.id === id) {
        this.selectedTaskList = null;
      }

      // Forcer une mise à jour réactive
      await nextTick();

      try {
        const response = await withNotifications(
          () => del(`task-lists/${id}`),
          {
            hideSuccess: false,
          }
        );

        // Vérifier que la suppression a bien réussi
        if (!response || !response.success) {
          // Restaurer l'état original si échec
          this.taskLists = originalLists;
          this.selectedTaskList = originalSelected;
          this.error = "Échec de la suppression de la liste de tâches";
          await nextTick(); // Forcer le re-rendu
          return;
        }

        // Nettoyer les tâches associées à cette liste du store des tâches
        if (taskStore.tasks.some((task) => task.listId === id)) {
          taskStore.tasks = taskStore.tasks.filter(
            (task) => task.listId !== id
          );
        }

        // Succès confirmé - l'interface est déjà à jour grâce à la mise à jour optimiste
      } catch (err) {
        // Restaurer l'état original en cas d'erreur
        this.taskLists = originalLists;
        this.selectedTaskList = originalSelected;
        this.error = "Erreur lors de la suppression de la liste de tâches.";
        await nextTick(); // Forcer le re-rendu

        throw err;
      } finally {
        this.loading = false;
        await nextTick(); // Forcer le re-rendu final
      }
    },

    selectTaskList(list: TaskList | null) {
      this.selectedTaskList = list;
    },
  },

  persist: true,
});
