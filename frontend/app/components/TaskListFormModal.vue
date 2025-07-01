<script setup lang="ts">
import { useTaskListStore } from "~/stores/task-list.store";
import {
  taskListSchema,
  type TaskListSchema,
} from "~/utils/validation-schemas";

// Correction pour Nuxt UI v3.2.0
const isOpen = defineModel<boolean>({ default: false });

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

const taskListStore = useTaskListStore();

// État du formulaire avec Zod
const state = reactive<TaskListSchema>({
  name: "",
});

// Réinitialiser le formulaire quand la modal se ferme
watch(isOpen, (newValue) => {
  if (!newValue) {
    state.name = "";
  }
});

async function onSubmit() {
  try {
    await taskListStore.createTaskList({ name: state.name });
    emit("success");
    isOpen.value = false;
  } catch {
    // Gestion d'erreur déjà faite par le store
  }
}

function cancel() {
  isOpen.value = false;
}
</script>

<template>
  <SimpleModal
    v-model="isOpen"
    title="Nouvelle liste"
    icon="i-heroicons-queue-list"
  >
    <UForm :schema="taskListSchema" :state="state" @submit="onSubmit">
      <div class="space-y-5">
        <UFormField
          label="Nom de la liste"
          name="name"
          required
          class="clean-input"
        >
          <UInput
            v-model="state.name"
            placeholder="Entrez le nom de la liste"
            :disabled="taskListStore.loading"
            class="w-full"
            style="width: 100%"
          />
        </UFormField>
      </div>
    </UForm>

    <template #footer>
      <UButton color="neutral" variant="outline" size="md" @click="cancel">
        Annuler
      </UButton>
      <UButton
        type="submit"
        color="primary"
        variant="solid"
        size="md"
        :loading="taskListStore.loading"
        icon="i-heroicons-plus"
        @click="onSubmit"
      >
        Créer la liste
      </UButton>
    </template>
  </SimpleModal>
</template>
