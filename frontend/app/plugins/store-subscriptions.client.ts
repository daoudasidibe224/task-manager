import { useTaskStore } from "~/stores/task.store";

export default defineNuxtPlugin(() => {
  const taskStore = useTaskStore();
  taskStore.subscribeToTaskListChanges();
});
