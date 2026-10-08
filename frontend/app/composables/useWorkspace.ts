import { z } from "zod";
import {
  listSchema,
  profileSchema,
  taskSchema,
  type User,
  type TaskList,
  type TaskDraft,
  type Task,
} from "~/types/contracts";
export function useWorkspace() {
  const api = useTaskApi();
  const user = useState<User | null>("task-user", () => null);
  const lists = useState<TaskList[]>("task-lists", () => []);
  const loaded = useState("task-loaded", () => false);
  const loading = ref(false);
  const error = ref("");
  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const [profile, data] = await Promise.all([
        api.send("auth/profile", profileSchema),
        api.send("task-lists", listSchema.array()),
      ]);
      user.value = profile.user;
      lists.value = data;
      loaded.value = true;
    } catch (cause) {
      if (unauthorized(cause)) {
        user.value = null;
        lists.value = [];
        loaded.value = true;
      } else {
        error.value = messageFrom(cause);
        throw cause;
      }
    } finally {
      loading.value = false;
    }
  }
  async function login(credentials: { email: string; password: string }) {
    const profile = await api.send(
      "auth/login",
      profileSchema,
      "POST",
      credentials,
    );
    user.value = profile.user;
    loaded.value = true;
    await load();
    await navigateTo("/dashboard");
  }
  async function register(credentials: {
    email: string;
    password: string;
    firstname?: string;
  }) {
    const profile = await api.send(
      "auth/register",
      profileSchema,
      "POST",
      credentials,
    );
    user.value = profile.user;
    loaded.value = true;
    await load();
    await navigateTo("/dashboard");
  }
  async function updateChecklist(task: Task, id: string, completed: boolean) {
    await api.send(`tasks/${task.id}`, taskSchema, "PATCH", {
      expectedUpdatedAt: task.updatedAt,
      checklist: task.checklist.map((item) =>
        item.id === id ? { ...item, completed } : item,
      ),
    });
    await load();
  }
  async function logout() {
    await api.send("auth/logout", z.unknown(), "POST");
    user.value = null;
    lists.value = [];
    loaded.value = false;
    await navigateTo("/login");
  }
  async function createList(name: string) {
    await api.send("task-lists", listSchema, "POST", { name });
    await load();
  }
  async function renameList(
    id: string,
    name: string,
    expectedUpdatedAt?: string,
  ) {
    await api.send(`task-lists/${id}`, listSchema, "PATCH", {
      name,
      expectedUpdatedAt,
    });
    await load();
  }
  async function removeList(id: string) {
    await api.send(`task-lists/${id}`, z.unknown(), "DELETE");
    await load();
  }
  async function saveTask(
    draft: TaskDraft,
    id?: string,
    expectedUpdatedAt?: string,
    requestId?: string,
  ) {
    const body = {
      ...draft,
      expectedUpdatedAt,
      ...(!id ? { requestId } : {}),
      dueDate: draft.dueDate
        ? new Date(`${draft.dueDate}T12:00:00Z`).toISOString()
        : null,
    };
    await api.send(
      id ? `tasks/${id}` : "tasks",
      taskSchema,
      id ? "PATCH" : "POST",
      body,
    );
    await load();
  }
  async function completeTask(
    id: string,
    completed: boolean,
    expectedUpdatedAt?: string,
  ) {
    await api.send(`tasks/${id}`, taskSchema, "PATCH", {
      completed,
      expectedUpdatedAt,
    });
    await load();
  }
  async function deleteTask(id: string) {
    await api.send(`tasks/${id}`, z.unknown(), "DELETE");
    await load();
  }
  const tasks = computed(() => lists.value.flatMap((list) => list.tasks));
  return {
    user,
    lists,
    tasks,
    loaded,
    loading,
    error,
    load,
    login,
    register,
    updateChecklist,
    logout,
    createList,
    renameList,
    removeList,
    saveTask,
    completeTask,
    deleteTask,
  };
}
