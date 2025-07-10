import { computed } from "vue";
import { useTaskStore } from "~/stores/task.store";
import { useTaskListStore } from "~/stores/task-list.store";

export const useTasks = () => {
  const taskStore = useTaskStore();
  const taskListStore = useTaskListStore();

  const mappedPendingTasks = computed(() =>
    taskStore.tasks
      .filter(
        (task) => task.listId === taskListStore.selected?.id && !task.completed
      )
      .map((task) => ({
        ...task,
        title: task.shortDescription,
        description: task.longDescription || "",
      }))
  );

  const mappedCompletedTasks = computed(() =>
    taskStore.tasks
      .filter(
        (task) => task.listId === taskListStore.selected?.id && task.completed
      )
      .map((task) => ({
        ...task,
        title: task.shortDescription,
        description: task.longDescription || "",
        completedAt: task.updatedAt,
      }))
  );

  return {
    mappedPendingTasks,
    mappedCompletedTasks,
  };
};
