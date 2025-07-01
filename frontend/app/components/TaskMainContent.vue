<script setup lang="ts">
import type { Task } from "~/types";
import { useTaskListStore } from "~/stores/task-list.store";
import { useTaskStore } from "~/stores/task.store";
import { useTasks } from "~/composables/useTasks";

interface Props {
  selectedTask: Task | null;
}

interface Emits {
  (e: "select-task", task: Task): void;
  (e: "delete-task", taskId: string): void;
  (e: "create-task"): void;
}

const { selectedTask } = defineProps<Props>();
const emit = defineEmits<Emits>();

const taskListStore = useTaskListStore();
const taskStore = useTaskStore();
const { pendingTasks, completedTasks } = useTasks();

// État local
const showCompleted = ref(false);

// Méthodes
async function toggleTaskCompletion(task: Task) {
  try {
    await taskStore.toggleTaskCompletion(task);
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
}

function selectTask(task: Task) {
  emit("select-task", task);
}

function confirmDeleteTask(taskId: string) {
  emit("delete-task", taskId);
}

function createNewTask() {
  emit("create-task");
}
</script>

<template>
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">
          {{ taskListStore.selected?.name || "Gestionnaire de tâches" }}
        </h1>
        <UButton
          v-if="taskListStore.selected"
          color="primary"
          variant="solid"
          size="md"
          icon="i-heroicons-plus"
          @click="createNewTask"
        >
          Nouvelle tâche
        </UButton>
      </div>
    </div>

    <!-- Contenu -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div v-if="!taskListStore.selected" class="text-center py-12">
        <Icon
          name="i-heroicons-cursor-arrow-rays"
          class="w-16 h-16 mx-auto text-gray-400 mb-4"
        />
        <p class="text-xl text-gray-600">
          Sélectionnez une liste pour voir ses tâches
        </p>
      </div>

      <div v-else class="space-y-6">
        <!-- Tâches à faire -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">Tâches à faire</h3>
              <UBadge variant="soft">{{ pendingTasks.length }}</UBadge>
            </div>
          </template>

          <div
            v-if="pendingTasks.length === 0"
            class="text-center py-8 text-gray-600"
          >
            <Icon
              name="i-heroicons-check-circle"
              class="w-12 h-12 mx-auto mb-2 text-gray-400"
            />
            <p>Aucune tâche en cours</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="task in pendingTasks"
              :key="task.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
              @click="selectTask(task)"
            >
              <UCheckbox
                :model-value="task.completed"
                @update:model-value="() => toggleTaskCompletion(task)"
                @click.stop
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-800 truncate">
                  {{ task.shortDescription }}
                </p>
                <p class="text-sm text-gray-600">
                  Échéance:
                  {{ new Date(task.dueDate).toLocaleDateString("fr-FR") }}
                </p>
              </div>
              <div
                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-trash"
                  class="text-red-500 hover:text-red-700"
                  @click.stop="confirmDeleteTask(task.id)"
                />
                <Icon
                  v-if="selectedTask?.id === task.id"
                  name="i-heroicons-chevron-right"
                  class="w-5 h-5 text-blue-500"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Tâches terminées -->
        <UCard v-if="completedTasks.length > 0">
          <template #header>
            <div class="flex items-center justify-between">
              <UButton
                variant="ghost"
                class="p-0 h-auto"
                @click="showCompleted = !showCompleted"
              >
                <Icon
                  :name="
                    showCompleted
                      ? 'i-heroicons-chevron-down'
                      : 'i-heroicons-chevron-right'
                  "
                  class="w-4 h-4 mr-2"
                />
                <span class="text-lg font-semibold">Tâches terminées</span>
              </UButton>
              <UBadge variant="soft">{{ completedTasks.length }}</UBadge>
            </div>
          </template>

          <div v-if="showCompleted" class="space-y-2">
            <div
              v-for="task in completedTasks"
              :key="task.id"
              class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer group"
              @click="selectTask(task)"
            >
              <UCheckbox
                :model-value="task.completed"
                @update:model-value="() => toggleTaskCompletion(task)"
                @click.stop
              />
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-600 line-through truncate">
                  {{ task.shortDescription }}
                </p>
                <p class="text-sm text-gray-500">
                  Terminée le
                  {{ new Date(task.updatedAt).toLocaleDateString("fr-FR") }}
                </p>
              </div>
              <div
                class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-arrow-uturn-left"
                  title="Marquer comme non terminée"
                  @click.stop="toggleTaskCompletion(task)"
                />
                <UButton
                  variant="ghost"
                  size="xs"
                  icon="i-heroicons-trash"
                  class="text-red-500 hover:text-red-700"
                  @click.stop="confirmDeleteTask(task.id)"
                />
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
