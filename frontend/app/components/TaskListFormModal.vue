<script setup lang="ts">
import { useTaskListStore } from "~/stores/task-list.store";
import { ref, computed } from "vue";
import { z } from "zod";

const isOpen = defineModel<boolean>({ default: false });

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();
const taskListStore = useTaskListStore();

const formSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
});

type FormData = z.infer<typeof formSchema>;

const state = reactive<FormData>({ name: "" });
const errors = reactive<Partial<Record<keyof FormData, string>>>({});
const touched = reactive<Partial<Record<keyof FormData, boolean>>>({});

const validateField = (field: keyof FormData) => {
  try {
    const fieldSchema = formSchema.shape[field];
    fieldSchema.parse(state[field]);
    errors[field] = undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors[field] = error.errors[0]?.message;
    }
  }
};

watch(
  () => state.name,
  () => {
    if (touched.name) {
      validateField("name");
    }
  }
);

watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

function resetForm() {
  state.name = "";
  errors.name = undefined;
  touched.name = false;
}

const isFormValid = computed(() => {
  return formSchema.safeParse(state).success;
});

async function onSubmit() {
  touched.name = true;
  validateField("name");

  if (!isFormValid.value) {
    return;
  }

  try {
    await taskListStore.createTaskList({ name: state.name });
    emit("success");
    isOpen.value = false;
  } catch {
    // Error handling is done by the store
  }
}
</script>

<template>
  <SimpleModal
    v-model="isOpen"
    title="Nouvelle liste de tâches"
    icon="i-heroicons-folder-plus"
  >
    <form @submit.prevent="onSubmit" class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Nom de la liste <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            v-model="state.name"
            type="text"
            placeholder="Ex: Projets professionnels"
            :class="[
              'w-full px-4 py-3 border rounded-lg transition-all duration-200',
              'placeholder-gray-400 text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'hover:border-gray-400',
              errors.name && touched.name
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white',
            ]"
            @blur="touched.name = true"
            :disabled="taskListStore.loading"
          />
          <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span class="text-xs text-gray-500">
              {{ state.name.length }}/50
            </span>
          </div>
        </div>
        <p
          v-if="errors.name && touched.name"
          class="mt-1 text-sm text-red-600 flex items-center"
        >
          <Icon name="i-heroicons-exclamation-circle" class="w-4 h-4 mr-1" />
          {{ errors.name }}
        </p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        @click="onSubmit"
        :disabled="!isFormValid || taskListStore.loading"
        :class="[
          'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
          'flex items-center gap-2',
          isFormValid && !taskListStore.loading
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
        ]"
      >
        <Icon
          v-if="taskListStore.loading"
          name="i-heroicons-arrow-path"
          class="animate-spin h-5 w-5"
        />
        <Icon v-else name="i-heroicons-plus" class="w-5 h-5" />
        {{ taskListStore.loading ? "Création..." : "Créer la liste" }}
      </button>
    </template>
  </SimpleModal>
</template>
