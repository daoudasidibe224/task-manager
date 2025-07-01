<script setup lang="ts">
import { useTaskStore } from "~/stores/task.store";
import { useTaskListStore } from "~/stores/task-list.store";
import { taskSchema, type TaskSchema } from "~/utils/validation-schemas";

// Correction pour Nuxt UI v3.2.0
const isOpen = defineModel<boolean>({ default: false });

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

const taskStore = useTaskStore();
const taskListStore = useTaskListStore();

// État du formulaire avec Zod
const state = reactive<TaskSchema>({
  shortDescription: "",
  longDescription: "",
  dueDate: "",
  listId: "",
});

// Réinitialiser le formulaire quand la modal se ferme
watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

// Mettre à jour le listId quand la liste sélectionnée change
watch(
  () => taskListStore.selected,
  (newSelected) => {
    if (newSelected) {
      state.listId = newSelected.id;
    }
  },
  { immediate: true }
);

function resetForm() {
  state.shortDescription = "";
  state.longDescription = "";
  state.dueDate = "";
  state.listId = taskListStore.selected?.id || "";
}

async function onSubmit() {
  try {
    await taskStore.createTask({
      shortDescription: state.shortDescription,
      longDescription: state.longDescription,
      dueDate: new Date(state.dueDate),
      listId: state.listId,
    });

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
    title="Nouvelle tâche"
    icon="i-heroicons-clipboard-document-list"
  >
    <UForm :schema="taskSchema" :state="state" @submit="onSubmit">
      <div class="space-y-5">
        <!-- Description courte et Date limite sur la même ligne -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField
            label="Description courte"
            name="shortDescription"
            required
            class="clean-input"
          >
            <UInput
              v-model="state.shortDescription"
              placeholder="Que devez-vous faire ?"
              :disabled="taskStore.loading"
              class="w-full"
              style="width: 100%"
            />
          </UFormField>

          <UFormField
            label="Date limite"
            name="dueDate"
            required
            class="clean-input"
          >
            <UInput
              v-model="state.dueDate"
              type="date"
              :disabled="taskStore.loading"
              class="w-full"
              style="width: 100%; cursor: pointer"
            />
          </UFormField>
        </div>

        <!-- Description longue en bas -->
        <UFormField
          label="Description longue (optionnel)"
          name="longDescription"
          class="clean-input clean-textarea"
        >
          <UTextarea
            v-model="state.longDescription"
            placeholder="Décrivez en détail..."
            :rows="4"
            :disabled="taskStore.loading"
            :resize="false"
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
        :loading="taskStore.loading"
        icon="i-heroicons-plus"
        @click="onSubmit"
      >
        Créer la tâche
      </UButton>
    </template>
  </SimpleModal>
</template>
