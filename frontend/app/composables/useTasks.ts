import { computed } from "vue";
import { useTaskStore } from "~/stores/task.store";
import { useTaskListStore } from "~/stores/task-list.store";

export const useTasks = () => {
  const taskStore = useTaskStore();
  const taskListStore = useTaskListStore();

  const pendingTasks = computed(() =>
    taskStore.tasks.filter(
      (task) => task.listId === taskListStore.selected?.id && !task.completed
    )
  );

  const completedTasks = computed(() =>
    taskStore.tasks.filter(
      (task) => task.listId === taskListStore.selected?.id && task.completed
    )
  );

  const mappedPendingTasks = computed(() =>
    pendingTasks.value.map((task) => ({
      ...task,
      title: task.shortDescription,
      description: task.longDescription || "",
    }))
  );

  const mappedCompletedTasks = computed(() =>
    completedTasks.value.map((task) => ({
      ...task,
      title: task.shortDescription,
      description: task.longDescription || "",
      completedAt: task.updatedAt,
    }))
  );

  return {
    pendingTasks,
    completedTasks,
    mappedPendingTasks,
    mappedCompletedTasks,
  };
};
