import { defineStore } from "pinia";
import { nextTick } from "vue";
import { useTaskListStore } from "./task-list.store";
import type { Task, CreateTaskDto, UpdateTaskDto, TaskFilters } from "~/types";

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

export const useTaskStore = defineStore("task", () => {
  const state = reactive<TaskState>({
    tasks: [],
    loading: false,
    error: null,
  });

  const tasks = computed(() => state.tasks);

  function validateTasks() {
    try {
      state.tasks = state.tasks.filter(
        (task) =>
          task &&
          typeof task.id === "string" &&
          typeof task.shortDescription === "string" &&
          typeof task.listId === "string" &&
          task.id.length > 10 &&
          !task.id.includes("undefined") &&
          !task.id.includes("null")
      );
    } catch {
      state.tasks = [];
    }
  }

  async function fetchTasks(filters: TaskFilters = {}) {
    if (filters.listId) {
      if (
        typeof filters.listId !== "string" ||
        filters.listId.trim() === "" ||
        filters.listId.length < 10 ||
        filters.listId.includes("undefined") ||
        filters.listId.includes("null")
      ) {
        state.tasks = [];
        state.error = "ID de liste invalide";
        return;
      }
    }

    state.loading = true;
    state.error = null;
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
        state.tasks = response.data;
        validateTasks();
      } else {
        state.tasks = [];
      }
    } catch {
      state.error = "Erreur lors de la récupération des tâches.";
      state.tasks = [];
    } finally {
      state.loading = false;
    }
  }

  async function createTask(data: CreateTaskDto) {
    if (
      !data.listId ||
      typeof data.listId !== "string" ||
      data.listId.trim() === ""
    ) {
      throw new Error("ID de liste requis pour créer une tâche");
    }

    state.loading = true;
    state.error = null;
    const { post } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const response = await withNotifications(
        () => post<Task>("tasks", { ...data }),
        { hideSuccess: false }
      );

      if (response?.success && response.data) {
        const taskListStore = useTaskListStore();
        if (taskListStore.selectedTaskList?.id === data.listId) {
          state.tasks.push(response.data);
        }
        return response.data;
      }
    } catch (err) {
      state.error = "Erreur lors de la création de la tâche.";
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function updateTask(id: string, data: UpdateTaskDto) {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return;
    }

    state.error = null;
    const { patch } = useApi();
    const { withNotifications } = useNotifications();

    const taskIndex = state.tasks.findIndex((t) => t.id === id);
    const originalTask =
      taskIndex !== -1 ? { ...state.tasks[taskIndex] } : null;

    if (taskIndex !== -1) {
      state.tasks[taskIndex] = {
        ...state.tasks[taskIndex],
        ...data,
        dueDate:
          data.dueDate instanceof Date
            ? data.dueDate.toISOString()
            : data.dueDate || state.tasks[taskIndex].dueDate,
      };
    }

    try {
      state.loading = true;
      const response = await withNotifications(
        () => patch<Task>(`tasks/${id}`, { ...data }),
        { hideSuccess: false }
      );

      if (response?.success && response.data) {
        const updatedTask = response.data;
        if (taskIndex !== -1) {
          state.tasks[taskIndex] = updatedTask;
        }
        return updatedTask;
      }
    } catch (err) {
      if (taskIndex !== -1 && originalTask) {
        state.tasks[taskIndex] = originalTask;
      }
      state.error = "Erreur lors de la mise à jour de la tâche.";
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function deleteTask(id: string) {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return;
    }

    state.loading = true;
    state.error = null;
    const { del } = useApi();
    const { withNotifications } = useNotifications();

    const originalTasks = [...state.tasks];
    const taskIndex = state.tasks.findIndex((t) => t.id === id);

    if (taskIndex === -1) {
      state.loading = false;
      return;
    }

    state.tasks = state.tasks.filter((t) => t.id !== id);
    await nextTick();

    try {
      const response = await withNotifications(() => del(`tasks/${id}`), {
        hideSuccess: false,
      });

      if (!response || !response.success) {
        state.tasks = originalTasks;
        state.error = "Échec de la suppression de la tâche";
        await nextTick();
        return;
      }
    } catch (err) {
      state.tasks = originalTasks;
      state.error = "Erreur lors de la suppression de la tâche.";
      await nextTick();
      throw err;
    } finally {
      state.loading = false;
      await nextTick();
    }
  }

  async function toggleTaskCompletion(task: Task) {
    if (!task || !task.id) {
      return;
    }
    return updateTask(task.id, { completed: !task.completed });
  }

  function subscribeToTaskListChanges() {
    const taskListStore = useTaskListStore();
    let currentListId: string | null = null;

    watch(
      () => taskListStore.selectedTaskList?.id || null,
      (newListId) => {
        if (newListId === currentListId) {
          return;
        }

        if (
          newListId &&
          (typeof newListId !== "string" ||
            newListId.length < 10 ||
            newListId.includes("undefined"))
        ) {
          taskListStore.selectTaskList(null);
          state.tasks = [];
          return;
        }

        currentListId = newListId;

        if (newListId) {
          if (!state.loading) {
            fetchTasks({ listId: newListId });
          }
        } else {
          state.tasks = [];
        }
      },
      { immediate: false }
    );
  }

  async function refreshCurrentListTasks() {
    const taskListStore = useTaskListStore();
    if (taskListStore.selectedTaskList?.id) {
      await fetchTasks({ listId: taskListStore.selectedTaskList.id });
    }
  }

  function resetState() {
    state.tasks = [];
    state.loading = false;
    state.error = null;
  }

  return {
    ...toRefs(state),
    tasks,
    validateTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskCompletion,
    subscribeToTaskListChanges,
    refreshCurrentListTasks,
    resetState,
  };
});
