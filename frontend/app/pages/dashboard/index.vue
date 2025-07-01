<template>
  <div class="min-h-screen bg-gray-50 font-sans">
    <!-- Layout principal avec 3 colonnes -->
    <div class="flex h-screen">
      <!-- Sidebar gauche - Listes avec design propre -->
      <div
        :class="[
          'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-16' : 'w-1/4',
        ]"
      >
        <!-- Header sidebar avec toggle -->
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
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                :d="sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'"
              />
            </svg>
          </button>
        </div>

        <!-- Bouton nouvelle liste -->
        <div v-if="!sidebarCollapsed" class="p-4 border-b border-gray-200">
          <button
            class="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
            @click="showCreateTaskListModal = true"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
            Nouvelle liste
          </button>
        </div>

        <!-- Bouton nouvelle liste en mode rétracté -->
        <div v-else class="p-2">
          <button
            class="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center"
            title="Nouvelle liste"
            @click="showCreateTaskListModal = true"
          >
            <svg
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4v16m8-8H4"
              ></path>
            </svg>
          </button>
        </div>

        <!-- Liste des tâches avec animation -->
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
                  <svg
                    class="w-3 h-3 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
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
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- État vide -->
          <div
            v-if="
              lists.length === 0 && !sidebarCollapsed && !taskListStore.loading
            "
            class="text-center text-gray-500 py-8"
          >
            <svg
              class="w-8 h-8 mx-auto mb-2 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p class="text-sm">Aucune liste créée</p>
          </div>
        </div>
      </div>

      <!-- Contenu principal - Tâches -->
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
                color="primary"
                variant="solid"
                size="md"
                icon="i-heroicons-plus"
                @click="showCreateTaskModal = true"
              >
                Nouvelle tâche
              </UButton>
            </ClientOnly>

            <UButton
              color="neutral"
              variant="outline"
              size="md"
              icon="i-heroicons-arrow-right-on-rectangle"
              @click="logout"
              title="Déconnexion"
            >
            </UButton>
          </div>
        </div>

        <!-- Contenu principal avec transitions -->
        <div class="flex-1 overflow-auto p-6">
          <Transition name="content-fade" mode="out-in">
            <!-- État de sélection de liste -->
            <div
              v-if="!selectedList"
              key="no-selection"
              class="text-center text-gray-500 mt-20"
            >
              <svg
                class="w-16 h-16 mx-auto mb-4 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p class="text-lg">Sélectionnez une liste pour voir ses tâches</p>
            </div>

            <!-- État de chargement -->
            <div
              v-else-if="isLoadingTasks"
              key="loading"
              class="space-y-4 pt-6"
            >
              <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
            </div>

            <!-- Contenu des tâches -->
            <div v-else key="tasks-content" class="space-y-6">
              <!-- Tâches à faire -->
              <div>
                <h3
                  class="text-lg font-semibold mb-4 text-gray-900 flex items-center"
                >
                  <svg
                    class="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  {{ selectedList?.name || "Tâches à faire" }}
                </h3>

                <div class="space-y-3">
                  <div
                    v-for="task in pendingTasks"
                    :key="task.id"
                    class="flex items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-all duration-200 cursor-pointer group"
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
                        <svg
                          class="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-if="pendingTasks.length === 0"
                  class="text-gray-500 text-center py-8"
                >
                  <svg
                    class="w-8 h-8 mx-auto mb-2 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p class="text-sm">Toutes les tâches sont terminées !</p>
                </div>
              </div>

              <!-- Tâches terminées -->
              <div>
                <button
                  class="flex items-center text-lg font-semibold mb-4 text-gray-900 hover:text-gray-700 transition-colors"
                  @click="showCompleted = !showCompleted"
                >
                  <svg
                    class="w-5 h-5 mr-2 transition-transform"
                    :class="{ 'rotate-90': showCompleted }"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    ></path>
                  </svg>
                  Tâches terminées ({{ completedTasks.length }})
                </button>

                <div v-if="showCompleted" class="space-y-3">
                  <div
                    v-for="task in completedTasks"
                    :key="task.id"
                    class="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg transition-all duration-200"
                  >
                    <button
                      class="mr-4 text-green-600 hover:text-green-800 transition-colors"
                      title="Restaurer la tâche"
                      @click="restoreTask(task)"
                    >
                      ↩️
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

      <!-- Sidebar droite - Détails de la tâche -->
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
                  :color="selectedTask.completed ? 'success' : 'warning'"
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
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              Supprimer la tâche
            </button>
          </div>
        </div>
      </ClientOnly>
    </div>

    <!-- Modales utilisant les composants existants -->
    <!-- Modal nouvelle liste -->
    <TaskListFormModal
      v-model="showCreateTaskListModal"
      @success="handleTaskListCreated"
    />

    <!-- Modal nouvelle tâche -->
    <TaskFormModal v-model="showCreateTaskModal" @success="handleTaskCreated" />

    <!-- Modal confirmation suppression liste -->
    <DeleteConfirmationModal
      v-model="showDeleteTaskListModal"
      :title="`Supprimer la liste`"
      :message="`Êtes-vous sûr de vouloir supprimer la liste « ${taskListToDelete?.name} » ? Toutes les tâches associées seront également supprimées.`"
      confirm-label="Supprimer"
      @confirm="handleDeleteTaskList"
      @cancel="hideDeleteTaskListModal"
    />

    <!-- Modal confirmation suppression tâche -->
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

// Type pour les tâches avec propriétés mappées pour l'UI
interface TaskWithMappedProps
  extends Omit<Task, "shortDescription" | "longDescription"> {
  title: string;
  description: string;
  completedAt?: string;
}

// Layout pour éviter l'affichage du header/navigation par défaut
definePageMeta({
  layout: "dashboard",
});

// Stores
const taskListStore = useTaskListStore();
const taskStore = useTaskStore();
const authStore = useAuthStore();
const { mappedPendingTasks, mappedCompletedTasks } = useTasks();

// État réactif basé sur les stores
const lists = computed(() => taskListStore.lists);
const selectedList = computed(() => taskListStore.selected);

// État local pour l'interface
const selectedTask = ref<TaskWithMappedProps | null>(null);
const showCompleted = ref(false);
const sidebarCollapsed = ref(false);
const isLoadingTasks = ref(false);

// États des modales simples
const showCreateTaskListModal = ref(false);
const showCreateTaskModal = ref(false);
const showDeleteTaskListModal = ref(false);
const showDeleteTaskModal = ref(false);
const taskListToDelete = ref<TaskList | null>(null);
const taskToDelete = ref<Task | null>(null);

// Aliases pour compatibilité avec le template existant
const pendingTasks = mappedPendingTasks;
const completedTasks = mappedCompletedTasks;

// Méthodes
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
    // Gestion d'erreur déjà faite par le store
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

// Handlers pour les modales
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

// Handlers pour les événements des modales
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

// Initialisation
onMounted(async () => {
  await taskListStore.fetchAllTaskLists();
});
</script>

<style scoped>
/* Animation pour la sidebar droite */
.animate-fade-in-right {
  animation: fadeInRight 0.3s ease-out;
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Transitions pour le contenu principal */
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

/* Smooth transitions pour tous les éléments */
* {
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Amélioration des transitions pour les hover states */
.group:hover .group-hover\:opacity-100 {
  transition-delay: 0ms;
}

/* Animation pour les listes */
.list-item-enter-active,
.list-item-leave-active {
  transition: all 0.2s ease-in-out;
}

.list-item-enter-from,
.list-item-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

.list-item-move {
  transition: transform 0.2s ease-in-out;
}
</style>
