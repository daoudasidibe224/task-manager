<script setup lang="ts">
import { useTaskListStore } from "~/stores/task-list.store";
import { z } from "zod";

const isOpen = defineModel<boolean>({ default: false });

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

const taskListStore = useTaskListStore();

// Schéma de validation
const formSchema = z.object({
  name: z
    .string()
    .min(3, "Le nom doit contenir au moins 3 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères")
    .regex(
      /^[a-zA-Z0-9À-ÿ\s\-']+$/,
      "Le nom contient des caractères non autorisés"
    ),
});

type FormData = z.infer<typeof formSchema>;

// État du formulaire
const state = reactive<FormData>({
  name: "",
});

// État des erreurs
const errors = reactive<Partial<Record<keyof FormData, string>>>({});
const touched = reactive<Partial<Record<keyof FormData, boolean>>>({});

// Validation en temps réel
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

// Watcher pour validation en temps réel
watchEffect(() => {
  if (touched.name) {
    validateField("name");
  }
});

// Réinitialiser le formulaire
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

// Validation du formulaire
const isFormValid = computed(() => {
  try {
    formSchema.parse(state);
    return true;
  } catch {
    return false;
  }
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
            placeholder="Ex: Projets personnels"
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
            @keyup.enter="onSubmit"
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
          <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          {{ errors.name }}
        </p>
        <p class="mt-2 text-sm text-gray-600">
          Donnez un nom descriptif à votre liste pour mieux organiser vos
          tâches.
        </p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        class="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
        @click="cancel"
        :disabled="taskListStore.loading"
      >
        Annuler
      </button>
      <button
        type="button"
        :class="[
          'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
          'flex items-center gap-2',
          isFormValid && !taskListStore.loading
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
        ]"
        @click="onSubmit"
        :disabled="!isFormValid || taskListStore.loading"
      >
        <svg
          v-if="!taskListStore.loading"
          class="w-5 h-5"
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
        <svg
          v-else
          class="animate-spin h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {{ taskListStore.loading ? "Création..." : "Créer la liste" }}
      </button>
    </template>
  </SimpleModal>
</template>
