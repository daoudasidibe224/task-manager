<script setup lang="ts">
import type { TaskList } from "~/types";
import { useTaskListStore } from "~/stores/task-list.store";
import { useTaskStore } from "~/stores/task.store";

interface Props {
  collapsed: boolean;
}

interface Emits {
  (e: "toggle-collapsed" | "create-list"): void;
  (e: "select-task-list", list: TaskList): void;
  (e: "delete-list", listId: string): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

const taskListStore = useTaskListStore();
const taskStore = useTaskStore();

async function selectTaskList(list: TaskList) {
  try {
    taskListStore.selectTaskList(list);
    emit("select-task-list", list);
    // Force le rafraîchissement des tâches de la nouvelle liste
    await taskStore.fetchTasks({ listId: list.id });
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
}

function confirmDeleteList(listId: string) {
  emit("delete-list", listId);
}

function createNewList() {
  emit("create-list");
}
</script>

<template>
  <div
    class="bg-white border-r border-gray-200 transition-all duration-300 flex-shrink-0"
    :class="collapsed ? 'w-16' : 'w-80'"
  >
    <!-- Header Sidebar -->
    <div class="p-4 border-b border-gray-200 flex items-center justify-between">
      <h2 v-if="!collapsed" class="text-lg font-semibold text-gray-800">
        Mes listes
      </h2>
      <div class="flex items-center gap-2">
        <UButton
          v-if="!collapsed"
          size="sm"
          variant="soft"
          icon="i-heroicons-plus"
          @click="createNewList"
        >
          Nouvelle liste
        </UButton>
        <UButton
          variant="ghost"
          size="sm"
          :icon="
            collapsed ? 'i-heroicons-chevron-right' : 'i-heroicons-chevron-left'
          "
          @click="emit('toggle-collapsed')"
        />
      </div>
    </div>

    <!-- Liste des listes -->
    <div class="overflow-y-auto flex-1">
      <div v-if="taskListStore.loading" class="p-4">
        <USkeleton v-for="i in 3" :key="i" class="h-4 w-full mb-2" />
      </div>

      <div
        v-else-if="taskListStore.lists.length === 0"
        class="p-4 text-center text-gray-600"
      >
        <Icon
          name="i-heroicons-folder-open"
          class="w-8 h-8 mx-auto mb-2 text-gray-500"
        />
        <p v-if="!collapsed" class="text-gray-600">Aucune liste</p>
      </div>

      <div v-else class="p-2">
        <div
          v-for="list in taskListStore.lists"
          :key="list.id"
          class="group relative"
        >
          <UButton
            variant="ghost"
            :class="[
              'w-full justify-start mb-1 relative',
              taskListStore.selected?.id === list.id
                ? 'bg-blue-50 text-blue-700'
                : '',
            ]"
            :title="collapsed ? list.name : undefined"
            @click="selectTaskList(list)"
          >
            <Icon name="i-heroicons-folder" class="w-4 h-4 flex-shrink-0" />
            <span v-if="!collapsed" class="ml-2 truncate">{{ list.name }}</span>
          </UButton>

          <UButton
            v-if="!collapsed"
            variant="ghost"
            size="xs"
            icon="i-heroicons-trash"
            class="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
            @click="confirmDeleteList(list.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
