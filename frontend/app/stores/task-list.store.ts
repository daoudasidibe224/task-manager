import { defineStore } from "pinia";
import { nextTick } from "vue";
import type { TaskList, CreateTaskListDto, UpdateTaskListDto } from "~/types";

interface TaskListState {
  taskLists: TaskList[];
  selectedTaskList: TaskList | null;
  loading: boolean;
  error: string | null;
}

export const useTaskListStore = defineStore("taskList", () => {
  const state = reactive<TaskListState>({
    taskLists: [],
    selectedTaskList: null,
    loading: false,
    error: null,
  });

  const lists = computed(() => state.taskLists);
  const selected = computed(() => state.selectedTaskList);

  function validatePersistedState() {
    try {
      state.selectedTaskList = null;
      state.taskLists = state.taskLists.filter(
        (list) =>
          list &&
          typeof list.id === "string" &&
          typeof list.name === "string" &&
          list.id.length > 10 &&
          !list.id.includes("undefined") &&
          !list.id.includes("null") &&
          list.name.trim().length > 0
      );
    } catch {
      state.taskLists = [];
      state.selectedTaskList = null;
    }
  }

  async function fetchAllTaskLists() {
    state.loading = true;
    state.error = null;
    const { get } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const response = await withNotifications(
        () => get<TaskList[]>("task-lists"),
        { hideSuccess: true }
      );
      if (response?.success && response.data) {
        state.taskLists = response.data;
        state.selectedTaskList = null;
      } else {
        state.taskLists = [];
        state.selectedTaskList = null;
      }
    } catch {
      state.error = "Erreur lors de la récupération des listes de tâches.";
      state.taskLists = [];
      state.selectedTaskList = null;
    } finally {
      state.loading = false;
    }
  }

  async function fetchTaskListById(id: string) {
    if (
      !id ||
      typeof id !== "string" ||
      id.trim() === "" ||
      id.length < 10 ||
      id.includes("cmckccd4w0002")
    ) {
      state.selectedTaskList = null;
      return;
    }

    state.loading = true;
    state.error = null;
    const { get } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const response = await withNotifications(
        () => get<TaskList>(`task-lists/${id}`),
        { hideSuccess: true }
      );
      if (response?.success && response.data) {
        state.selectedTaskList = response.data;
      } else {
        state.selectedTaskList = null;
      }
    } catch {
      state.error = "Erreur lors de la récupération de la liste de tâches.";
      state.selectedTaskList = null;
    } finally {
      state.loading = false;
    }
  }

  async function createTaskList(data: CreateTaskListDto) {
    state.loading = true;
    state.error = null;
    const { post } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const response = await withNotifications(
        () => post<TaskList>("task-lists", { ...data }),
        { hideSuccess: false }
      );

      if (response?.success && response.data) {
        state.taskLists.push(response.data);
        return response.data;
      }
    } catch (err) {
      state.error = "Erreur lors de la création de la liste de tâches.";
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function updateTaskList(id: string, data: UpdateTaskListDto) {
    state.loading = true;
    state.error = null;
    const { patch } = useApi();
    const { withNotifications } = useNotifications();

    try {
      const response = await withNotifications(
        () => patch<TaskList>(`task-lists/${id}`, { ...data }),
        { hideSuccess: false }
      );

      if (response?.success && response.data) {
        const updatedList = response.data;
        const index = state.taskLists.findIndex((list) => list.id === id);
        if (index !== -1) {
          state.taskLists[index] = updatedList;
        }
        if (state.selectedTaskList?.id === id) {
          state.selectedTaskList = updatedList;
        }
        return updatedList;
      }
    } catch (err) {
      state.error = "Erreur lors de la mise à jour de la liste de tâches.";
      throw err;
    } finally {
      state.loading = false;
    }
  }

  async function deleteTaskList(id: string) {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return;
    }

    state.loading = true;
    state.error = null;
    const { del } = useApi();
    const { withNotifications } = useNotifications();

    const originalLists = [...state.taskLists];
    const originalSelected = state.selectedTaskList;

    state.taskLists = state.taskLists.filter((list) => list.id !== id);
    if (state.selectedTaskList?.id === id) {
      state.selectedTaskList = null;
    }

    await nextTick();

    try {
      const response = await withNotifications(() => del(`task-lists/${id}`), {
        hideSuccess: false,
      });

      if (!response || !response.success) {
        state.taskLists = originalLists;
        state.selectedTaskList = originalSelected;
        state.error = "Échec de la suppression de la liste de tâches";
        await nextTick();
        return;
      }

      // Les tâches de la liste supprimée seront automatiquement
      // nettoyées lors du prochain fetchTasks
    } catch (err) {
      state.taskLists = originalLists;
      state.selectedTaskList = originalSelected;
      state.error = "Erreur lors de la suppression de la liste de tâches.";
      await nextTick();
      throw err;
    } finally {
      state.loading = false;
      await nextTick();
    }
  }

  function selectTaskList(list: TaskList | null) {
    if (
      list &&
      (!list.id || typeof list.id !== "string" || list.id.length < 10)
    ) {
      state.selectedTaskList = null;
      return;
    }
    state.selectedTaskList = list;
  }

  return {
    ...toRefs(state),
    lists,
    selected,
    validatePersistedState,
    fetchAllTaskLists,
    fetchTaskListById,
    createTaskList,
    updateTaskList,
    deleteTaskList,
    selectTaskList,
    $persist: {
      pick: ["taskLists"],
    },
  };
});
