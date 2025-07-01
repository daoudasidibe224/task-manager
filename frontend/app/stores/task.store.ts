import { defineStore } from "pinia";
import { nextTick } from "vue";
import { useTaskListStore } from "./task-list.store";
import type { Task, CreateTaskDto, UpdateTaskDto, TaskFilters } from "~/types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export const useTaskStore = defineStore("task", {
  state: (): TaskState => ({
    tasks: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchTasks(filters: TaskFilters = {}) {
      this.loading = true;
      this.error = null;
      const { get } = useApi();
      const { withNotifications } = useNotifications();

      const queryParams = new URLSearchParams();
      if (filters.listId) {
        queryParams.append("listId", filters.listId);
      }
      if (typeof filters.completed === "boolean") {
        queryParams.append("completed", String(filters.completed));
      }

      try {
        const response = await withNotifications(
          () => get<Task[]>(`tasks?${queryParams.toString()}`),
          { hideSuccess: true }
        );
        if (response?.success && response.data) {
          this.tasks = response.data;
        } else {
          this.tasks = [];
        }
      } catch {
        this.error = "Erreur lors de la récupération des tâches.";
        this.tasks = [];
      } finally {
        this.loading = false;
      }
    },

    async createTask(data: CreateTaskDto) {
      this.loading = true;
      this.error = null;
      const { post } = useApi();
      const { withNotifications } = useNotifications();

      try {
        const response = await withNotifications(
          () => post<Task>("tasks", { ...data }),
          { hideSuccess: false }
        );

        if (response?.success && response.data) {
          // Vérifier si la tâche créée appartient à la liste actuellement sélectionnée
          const taskListStore = useTaskListStore();
          if (taskListStore.selectedTaskList?.id === data.listId) {
            this.tasks.push(response.data);
          }
          return response.data;
        }
      } catch (err) {
        this.error = "Erreur lors de la création de la tâche.";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateTask(id: string, data: UpdateTaskDto) {
      this.error = null;
      const { patch } = useApi();
      const { withNotifications } = useNotifications();

      // Mise à jour optimiste pour la réactivité immédiate
      const taskIndex = this.tasks.findIndex((t) => t.id === id);
      const originalTask =
        taskIndex !== -1 ? { ...this.tasks[taskIndex] } : null;

      if (taskIndex !== -1) {
        // Mise à jour immédiate de l'interface
        this.tasks[taskIndex] = {
          ...this.tasks[taskIndex],
          ...data,
          dueDate:
            data.dueDate instanceof Date
              ? data.dueDate.toISOString()
              : data.dueDate || this.tasks[taskIndex].dueDate,
        };
      }

      try {
        this.loading = true;
        const response = await withNotifications(
          () => patch<Task>(`tasks/${id}`, { ...data }),
          { hideSuccess: false }
        );

        if (response?.success && response.data) {
          const updatedTask = response.data;
          if (taskIndex !== -1) {
            this.tasks[taskIndex] = updatedTask;
          }
          return updatedTask;
        }
      } catch (err) {
        // Restaurer l'état original en cas d'erreur
        if (taskIndex !== -1 && originalTask) {
          this.tasks[taskIndex] = originalTask;
        }
        this.error = "Erreur lors de la mise à jour de la tâche.";
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteTask(id: string) {
      this.loading = true;
      this.error = null;
      const { del } = useApi();
      const { withNotifications } = useNotifications();

      // Suppression optimiste - supprimer de l'interface immédiatement
      const originalTasks = [...this.tasks];
      const taskIndex = this.tasks.findIndex((t) => t.id === id);

      if (taskIndex === -1) {
        this.loading = false;
        return;
      }

      // Mise à jour optimiste de l'interface
      this.tasks = this.tasks.filter((t) => t.id !== id);

      // Forcer une mise à jour réactive
      await nextTick();

      try {
        const response = await withNotifications(() => del(`tasks/${id}`), {
          hideSuccess: false,
        });

        // Vérifier que la suppression a bien réussi
        if (!response || !response.success) {
          // Restaurer l'état original si échec
          this.tasks = originalTasks;
          this.error = "Échec de la suppression de la tâche";
          await nextTick(); // Forcer le re-rendu
          return;
        }

        // Succès confirmé - l'interface est déjà à jour grâce à la mise à jour optimiste
      } catch (err) {
        // Restaurer l'état original en cas d'erreur
        this.tasks = originalTasks;
        this.error = "Erreur lors de la suppression de la tâche.";
        await nextTick(); // Forcer le re-rendu

        throw err;
      } finally {
        this.loading = false;
        await nextTick(); // Forcer le re-rendu final
      }
    },

    async toggleTaskCompletion(task: Task) {
      return this.updateTask(task.id, { completed: !task.completed });
    },

    subscribeToTaskListChanges() {
      const taskListStore = useTaskListStore();
      let currentListId: string | null = null;

      // Écouter UNIQUEMENT les changements de selectedTaskList, pas tout le store
      watch(
        () => taskListStore.selectedTaskList?.id || null,
        (newListId) => {
          // Éviter les appels redondants
          if (newListId === currentListId) {
            return;
          }

          currentListId = newListId;

          if (newListId) {
            // Éviter les appels si déjà en cours de chargement
            if (!this.loading) {
              this.fetchTasks({ listId: newListId });
            }
          } else {
            this.tasks = [];
          }
        },
        { immediate: true } // Charger immédiatement si une liste est déjà sélectionnée
      );
    },

    // Nouvelle méthode pour rafraîchir les tâches de la liste actuelle
    async refreshCurrentListTasks() {
      const taskListStore = useTaskListStore();
      if (taskListStore.selectedTaskList) {
        await this.fetchTasks({ listId: taskListStore.selectedTaskList.id });
      }
    },
  },
});
