<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <div class="flex h-screen">
      <!-- Sidebar gauche -->
      <div
        :class="[
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-1/4',
        ]"
      >
        <div
          class="p-4 border-b border-gray-200 flex items-center justify-between"
        >
          <div v-if="!sidebarCollapsed">
            <h2 class="text-lg font-semibold text-gray-900 mb-3">Mes listes</h2>
          </div>

          <button
            :class="sidebarCollapsed ? 'mx-auto' : ''"
            class="text-gray-500 hover:text-gray-700 p-1 rounded transition-colors"
            @click="toggleSidebar"
          >
            <Icon
              :name="
                sidebarCollapsed
                  ? 'i-heroicons-chevron-right'
                  : 'i-heroicons-chevron-left'
              "
              class="w-5 h-5"
            />
          </button>
        </div>

        <div v-if="!sidebarCollapsed" class="p-4 border-b border-gray-200">
          <button
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            @click="showCreateTaskListModal = true"
          >
            <Icon name="i-heroicons-plus" class="w-4 h-4" />
            Nouvelle liste
          </button>
        </div>

        <div v-else class="p-2">
          <button
            class="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            title="Nouvelle liste"
            @click="showCreateTaskListModal = true"
          >
            <Icon name="i-heroicons-plus" class="w-4 h-4" />
          </button>
        </div>

        <div class="flex-1 overflow-auto p-4" @click="deselectList">
          <div class="space-y-2">
            <div
              v-for="list in lists"
              :key="list.id"
              :class="[
                'flex items-center justify-between rounded-lg hover:bg-gray-100 cursor-pointer transition-colors',
                sidebarCollapsed ? 'p-2 justify-center' : 'p-3',
                selectedList?.id === list.id
                  ? 'bg-blue-50 border border-blue-200'
                  : '',
              ]"
              :title="sidebarCollapsed ? list.name : ''"
              @click.stop="selectList(list)"
            >
              <div
                :class="
                  sidebarCollapsed ? 'flex justify-center' : 'flex items-center'
                "
              >
                <div
                  v-if="sidebarCollapsed"
                  class="w-6 h-6 bg-blue-100 rounded flex items-center justify-center"
                >
                  <Icon
                    name="i-heroicons-folder"
                    class="w-3 h-3 text-blue-600"
                  />
                </div>
                <span v-else class="text-gray-900 font-medium truncate">{{
                  list.name
                }}</span>
              </div>

              <button
                v-if="!sidebarCollapsed"
                class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                @click.stop="confirmDeleteTaskList(list)"
              >
                <Icon name="i-heroicons-trash" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            v-if="
              lists.length === 0 && !sidebarCollapsed && !taskListStore.loading
            "
            class="text-center text-gray-500 py-8 card border-dashed bg-gray-100/60"
          >
            <Icon
              name="i-heroicons-folder"
              class="w-8 h-8 mx-auto mb-2 text-gray-300"
            />
            <p class="text-sm">Aucune liste créée</p>
          </div>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="flex-1 flex flex-col bg-white">
        <div
          class="p-6 border-b border-gray-200 flex justify-between items-center"
        >
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Tâches</h1>
          </div>
          <div class="flex items-center gap-3">
            <ClientOnly>
              <UButton
                v-if="selectedList"
                class="btn-gradient"
                size="md"
                icon="i-heroicons-plus"
                @click="showCreateTaskModal = true"
              >
                Nouvelle tâche
              </UButton>
            </ClientOnly>

            <UButton
              color="gray"
              variant="outline"
              size="md"
              icon="i-heroicons-arrow-right-on-rectangle"
              @click="logout"
              title="Déconnexion"
            >
            </UButton>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-6">
          <Transition name="content-fade" mode="out-in">
            <div
              v-if="!selectedList"
              key="no-selection"
              class="text-center text-gray-500 mt-20"
            >
              <Icon
                name="i-heroicons-clipboard-document-list"
                class="w-16 h-16 mx-auto mb-4 text-gray-300"
              />
              <p class="text-lg">Sélectionnez une liste pour voir ses tâches</p>
            </div>

            <div
              v-else-if="isLoadingTasks"
              key="loading"
              class="space-y-4 pt-6"
            >
              <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>

            <div v-else key="tasks-content" class="space-y-6">
              <div>
                <h3
                  class="text-lg font-semibold mb-4 text-gray-900 flex items-center"
                >
                  <Icon
                    name="i-heroicons-clipboard-document-list"
                    class="w-5 h-5 mr-2 text-blue-600"
                  />
                  {{ selectedList?.name || "Tâches à faire" }}
                </h3>

                <div class="space-y-3">
                  <div
                    v-for="task in pendingTasks"
                    :key="task.id"
                    class="flex items-center p-4 card card-hover cursor-pointer group"
                    :class="{
                      'ring-2 ring-blue-500 shadow-sm':
                        selectedTask?.id === task.id,
                    }"
                    @click="selectTask(task)"
                  >
                    <input
                      type="checkbox"
                      class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      @click.stop="completeTask(task)"
                    />
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-gray-900 truncate">
                        {{ task.title }}
                      </p>
                      <p class="text-sm text-gray-500 mt-1">
                        Échéance: {{ formatDate(task.dueDate) }}
                      </p>
                    </div>
                    <div
                      class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <button
                        class="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                        @click.stop="confirmDeleteTask(task)"
                      >
                        <Icon name="i-heroicons-trash" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-if="pendingTasks.length === 0"
                  class="text-gray-500 text-center py-8"
                >
                  <Icon
                    name="i-heroicons-check-circle"
                    class="w-8 h-8 mx-auto mb-2 text-gray-300"
                  />
                  <p class="text-sm">Toutes les tâches sont terminées !</p>
                </div>
              </div>

              <div>
                <button
                  class="flex items-center text-lg font-semibold mb-4 text-gray-900 hover:text-gray-700 transition-colors"
                  @click="showCompleted = !showCompleted"
                >
                  <Icon
                    name="i-heroicons-chevron-down"
                    class="w-5 h-5 mr-2 transition-transform"
                    :class="{ 'rotate-90': showCompleted }"
                  />
                  Tâches terminées ({{ completedTasks.length }})
                </button>

                <div v-if="showCompleted" class="space-y-3">
                  <div
                    v-for="task in completedTasks"
                    :key="task.id"
                    class="flex items-center p-4 card card-hover bg-green-50 border-green-200"
                  >
                    <button
                      class="mr-4 text-green-600 hover:text-green-800 transition-colors"
                      title="Restaurer la tâche"
                      @click="restoreTask(task)"
                    >
                      <Icon name="i-heroicons-arrow-uturn-left" />
                    </button>
                    <div class="flex-1">
                      <p class="font-medium text-gray-900 line-through">
                        {{ task.title }}
                      </p>
                      <p class="text-sm text-gray-500">
                        Terminée le {{ formatDate(task.completedAt) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <ClientOnly>
        <div
          v-if="selectedTask"
          class="w-1/4 bg-white border-l border-gray-200 flex flex-col animate-fade-in-right"
        >
          <div class="p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">
              Détails de la tâche
            </h3>
          </div>

          <div class="flex-1 overflow-auto p-4">
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900 mb-2">
                  {{ selectedTask.title }}
                </h4>
                <UBadge
                  :color="selectedTask.completed ? 'green' : 'yellow'"
                  variant="subtle"
                >
                  {{ selectedTask.completed ? "Terminée" : "En cours" }}
                </UBadge>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Date de création</label
                >
                <p class="text-sm text-gray-600">
                  {{ formatDate(selectedTask.createdAt) }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Date limite</label
                >
                <p class="text-sm text-gray-600">
                  {{ formatDate(selectedTask.dueDate) }}
                </p>
              </div>

              <div v-if="selectedTask.description">
                <label class="block text-sm font-medium text-gray-700 mb-1"
                  >Description</label
                >
                <p class="text-sm text-gray-600 whitespace-pre-wrap">
                  {{ selectedTask.description }}
                </p>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-gray-200">
            <button
              class="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              @click="confirmDeleteSelectedTask"
            >
              <Icon name="i-heroicons-trash" class="w-4 h-4" />
              Supprimer la tâche
            </button>
          </div>
        </div>
      </ClientOnly>
    </div>

    <TaskListFormModal
      v-model="showCreateTaskListModal"
      @success="handleTaskListCreated"
    />

    <TaskFormModal v-model="showCreateTaskModal" @success="handleTaskCreated" />

    <DeleteConfirmationModal
      v-model="showDeleteTaskListModal"
      :title="`Supprimer la liste`"
      :message="`Êtes-vous sûr de vouloir supprimer la liste « ${taskListToDelete?.name} » ? Toutes les tâches associées seront également supprimées.`"
      confirm-label="Supprimer"
      @confirm="handleDeleteTaskList"
      @cancel="hideDeleteTaskListModal"
    />

    <DeleteConfirmationModal
      v-model="showDeleteTaskModal"
      :title="`Supprimer la tâche`"
      :message="`Êtes-vous sûr de vouloir supprimer la tâche « ${taskToDelete?.shortDescription} » ?`"
      confirm-label="Supprimer"
      @confirm="handleDeleteTask"
      @cancel="hideDeleteTaskModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useTaskListStore } from "~/stores/task-list.store";
import { useTaskStore } from "~/stores/task.store";
import { useAuthStore } from "~/stores/auth.store";
import { useTasks } from "~/composables/useTasks";
import type { Task, TaskList } from "~/types";
import { useNotifications } from "~/composables/useNotifications";

interface TaskWithMappedProps
  extends Omit<Task, "shortDescription" | "longDescription"> {
  title: string;
  description: string;
  completedAt?: string;
}

definePageMeta({
  layout: "dashboard",
});

const taskListStore = useTaskListStore();
const taskStore = useTaskStore();
const authStore = useAuthStore();
const { mappedPendingTasks, mappedCompletedTasks } = useTasks();

const lists = computed(() => taskListStore.lists);
const selectedList = computed(() => taskListStore.selected);

const selectedTask = ref<TaskWithMappedProps | null>(null);
const showCompleted = ref(false);
const sidebarCollapsed = ref(false);
const isLoadingTasks = ref(false);

const showCreateTaskListModal = ref(false);
const showCreateTaskModal = ref(false);
const showDeleteTaskListModal = ref(false);
const showDeleteTaskModal = ref(false);
const taskListToDelete = ref<TaskList | null>(null);
const taskToDelete = ref<Task | null>(null);

const pendingTasks = mappedPendingTasks;
const completedTasks = mappedCompletedTasks;

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const deselectList = () => {
  taskListStore.selectTaskList(null);
  selectedTask.value = null;
};

const selectList = async (list: TaskList) => {
  if (selectedList.value?.id === list.id) return;

  taskListStore.selectTaskList(list);
  selectedTask.value = null;
  isLoadingTasks.value = true;

  try {
    await taskStore.fetchTasks({ listId: list.id });
  } catch {
    taskListStore.selectTaskList(null);
    const { error: showError } = useNotifications();
    showError("Impossible de charger les tâches de cette liste.", {
      title: "Erreur de chargement",
    });
  } finally {
    isLoadingTasks.value = false;
  }
};

const selectTask = (task: TaskWithMappedProps) => {
  const originalTask = taskStore.tasks.find((t) => t.id === task.id);
  selectedTask.value = originalTask
    ? {
        ...originalTask,
        title: originalTask.shortDescription,
        description: originalTask.longDescription || "",
        createdAt: originalTask.createdAt,
        dueDate: originalTask.dueDate,
      }
    : null;
};

const confirmDeleteTaskList = (taskList: TaskList) => {
  taskListToDelete.value = taskList;
  showDeleteTaskListModal.value = true;
};

const confirmDeleteTask = (task: TaskWithMappedProps) => {
  const originalTask = taskStore.tasks.find((t) => t.id === task.id);
  if (originalTask) {
    taskToDelete.value = originalTask;
    showDeleteTaskModal.value = true;
  }
};

const confirmDeleteSelectedTask = () => {
  if (!selectedTask.value) return;
  const originalTask = taskStore.tasks.find(
    (t) => t.id === selectedTask.value!.id
  );
  if (originalTask) {
    taskToDelete.value = originalTask;
    showDeleteTaskModal.value = true;
  }
};

const hideDeleteTaskListModal = () => {
  showDeleteTaskListModal.value = false;
  taskListToDelete.value = null;
};

const hideDeleteTaskModal = () => {
  showDeleteTaskModal.value = false;
  taskToDelete.value = null;
};

const handleTaskListCreated = async () => {
  await taskListStore.fetchAllTaskLists();
};

const handleTaskCreated = async () => {
  if (selectedList.value) {
    await taskStore.fetchTasks({ listId: selectedList.value.id });
  }
};

const handleDeleteTaskList = async () => {
  if (!taskListToDelete.value) return;

  try {
    await taskListStore.deleteTaskList(taskListToDelete.value.id);
    hideDeleteTaskListModal();
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
};

const handleDeleteTask = async () => {
  if (!taskToDelete.value) return;

  try {
    await taskStore.deleteTask(taskToDelete.value.id);
    if (selectedTask.value?.id === taskToDelete.value.id) {
      selectedTask.value = null;
    }
    hideDeleteTaskModal();
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
};

const completeTask = async (task: TaskWithMappedProps) => {
  try {
    await taskStore.updateTask(task.id, { completed: true });
    if (selectedTask.value?.id === task.id) {
      selectedTask.value = null;
    }
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
};

const restoreTask = async (task: TaskWithMappedProps) => {
  try {
    await taskStore.updateTask(task.id, { completed: false });
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
};

const formatDate = (date: string | Date) => {
  if (typeof date === "string") {
    return new Date(date).toLocaleDateString("fr-FR");
  }
  return date.toLocaleDateString("fr-FR");
};

const logout = async () => {
  await authStore.logout();
};

onMounted(async () => {
  try {
    taskListStore.validatePersistedState();
    await taskListStore.fetchAllTaskLists();
    taskStore.subscribeToTaskListChanges();
    taskListStore.selectTaskList(null);
  } catch {
    const { error: showError } = useNotifications();
    showError("Une erreur est survenue lors du chargement des données.", {
      title: "Erreur",
    });
  }
});
</script>

<style scoped>
.content-fade-enter-active,
.content-fade-leave-active {
  transition: all 0.3s ease-in-out;
}
.content-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.content-fade-enter-to,
.content-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
