<script setup lang="ts">
import type { Task } from "~/types";
import { useTaskStore } from "~/stores/task.store";

interface Props {
  task: Task | null;
}

interface Emits {
  (e: "close"): void;
  (e: "delete-task", taskId: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const taskStore = useTaskStore();

// Tâche réactive qui se met à jour depuis le store
const reactiveTask = computed(() => {
  if (!props.task) return null;
  // Chercher la tâche mise à jour dans le store
  const updatedTask = taskStore.tasks.find((t) => t.id === props.task?.id);
  return updatedTask || props.task;
});

async function toggleTaskCompletion() {
  if (reactiveTask.value) {
    try {
      await taskStore.toggleTaskCompletion(reactiveTask.value);
    } catch {
      // Gestion d'erreur déjà faite par le store
    }
  }
}

function confirmDeleteTask() {
  if (props.task) {
    emit("delete-task", props.task.id);
  }
}
</script>

<template>
  <div
    v-if="reactiveTask"
    class="w-80 bg-white border-l border-gray-200 flex flex-col"
  >
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-800">Détails de la tâche</h3>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-heroicons-x-mark"
          @click="emit('close')"
        />
      </div>
    </div>

    <!-- Contenu -->
    <div class="flex-1 p-6 overflow-y-auto">
      <div class="space-y-6">
        <div>
          <h4 class="font-medium text-gray-800 mb-2">
            {{ reactiveTask.shortDescription }}
          </h4>
          <div class="space-y-3 text-sm">
            <div class="flex items-center gap-2">
              <Icon name="i-heroicons-calendar" class="w-4 h-4 text-gray-500" />
              <span class="text-gray-700">
                Créée le
                {{
                  new Date(reactiveTask.createdAt).toLocaleDateString("fr-FR")
                }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="i-heroicons-clock" class="w-4 h-4 text-gray-500" />
              <span class="text-gray-700">
                Échéance:
                {{ new Date(reactiveTask.dueDate).toLocaleDateString("fr-FR") }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <UCheckbox
                :model-value="reactiveTask.completed"
                @update:model-value="() => toggleTaskCompletion()"
              />
              <span class="text-gray-700">
                {{ reactiveTask.completed ? "Terminée" : "En cours" }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="reactiveTask.longDescription">
          <h5 class="font-medium text-gray-800 mb-2">Description détaillée</h5>
          <p class="text-gray-700 text-sm leading-relaxed">
            {{ reactiveTask.longDescription }}
          </p>
        </div>
      </div>
    </div>

    <!-- Footer avec bouton de suppression -->
    <div class="p-6 border-t border-gray-200">
      <UButton
        color="error"
        variant="soft"
        block
        icon="i-heroicons-trash"
        @click="confirmDeleteTask"
      >
        Supprimer la tâche
      </UButton>
    </div>
  </div>
</template>
