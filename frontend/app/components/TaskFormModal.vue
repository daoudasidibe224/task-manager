<script setup lang="ts">
import { useTaskStore } from "~/stores/task.store";
import { useTaskListStore } from "~/stores/task-list.store";
import { ref } from "vue";
import { z } from "zod";

const isOpen = defineModel<boolean>({ default: false });

interface Emits {
  (e: "success"): void;
}

const emit = defineEmits<Emits>();

const taskStore = useTaskStore();
const taskListStore = useTaskListStore();

const dueDateInput = ref<HTMLInputElement | null>(null);

const formSchema = z.object({
  shortDescription: z
    .string()
    .min(5, "La description doit contenir au moins 5 caractères")
    .max(200, "La description ne peut pas dépasser 200 caractères"),
  longDescription: z
    .string()
    .max(2000, "La description longue ne peut pas dépasser 2000 caractères")
    .optional(),
  dueDate: z
    .string()
    .min(1, "La date est requise")
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, "La date ne peut pas être dans le passé"),
  listId: z.string().min(1, "Une liste doit être sélectionnée"),
});

type FormData = z.infer<typeof formSchema>;

const state = reactive<FormData>({
  shortDescription: "",
  longDescription: "",
  dueDate: "",
  listId: taskListStore.selected?.id || "",
});

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

watchEffect(() => {
  if (touched.shortDescription) {
    validateField("shortDescription");
  }
});

watchEffect(() => {
  if (touched.dueDate) {
    validateField("dueDate");
  }
});

watchEffect(() => {
  if (touched.longDescription && state.longDescription) {
    validateField("longDescription");
  }
});

const minDate = computed(() => {
  const today = new Date();
  return today.toISOString().split("T")[0];
});

watch(isOpen, (newValue) => {
  if (!newValue) {
    resetForm();
  }
});

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

  Object.keys(errors).forEach((key) => {
    errors[key as keyof FormData] = undefined;
  });
  Object.keys(touched).forEach((key) => {
    touched[key as keyof FormData] = false;
  });
}

const isFormValid = computed(() => {
  try {
    formSchema.parse(state);
    return true;
  } catch {
    return false;
  }
});

async function onSubmit() {
  Object.keys(state).forEach((key) => {
    touched[key as keyof FormData] = true;
  });

  Object.keys(state).forEach((key) => {
    validateField(key as keyof FormData);
  });

  if (!isFormValid.value) {
    return;
  }

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
    // Error handling is done by the store
  }
}
</script>

<template>
  <SimpleModal
    v-model="isOpen"
    title="Nouvelle tâche"
    icon="i-heroicons-clipboard-document-list"
  >
    <form @submit.prevent="onSubmit" class="space-y-6">
      <!-- Short description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Description courte <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            v-model="state.shortDescription"
            type="text"
            placeholder="Ex: Terminer le rapport mensuel"
            :class="[
              'w-full px-4 py-3 border rounded-lg transition-all duration-200',
              'placeholder-gray-400 text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'hover:border-gray-400',
              errors.shortDescription && touched.shortDescription
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white',
            ]"
            @blur="touched.shortDescription = true"
            :disabled="taskStore.loading"
          />
          <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span class="text-xs text-gray-500">
              {{ state.shortDescription.length }}/200
            </span>
          </div>
        </div>
        <p
          v-if="errors.shortDescription && touched.shortDescription"
          class="mt-1 text-sm text-red-600 flex items-center"
        >
          <Icon name="i-heroicons-exclamation-circle" class="w-4 h-4 mr-1" />
          {{ errors.shortDescription }}
        </p>
      </div>

      <!-- Due date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Date limite <span class="text-red-500">*</span>
        </label>
        <div
          @click="
            dueDateInput?.showPicker
              ? dueDateInput.showPicker()
              : dueDateInput?.focus()
          "
        >
          <input
            ref="dueDateInput"
            v-model="state.dueDate"
            type="date"
            :min="minDate"
            :class="[
              'w-full px-4 py-3 border rounded-lg transition-all duration-200',
              'text-gray-900 cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'hover:border-gray-400',
              errors.dueDate && touched.dueDate
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white',
            ]"
            @blur="touched.dueDate = true"
            :disabled="taskStore.loading"
          />
        </div>
        <p
          v-if="errors.dueDate && touched.dueDate"
          class="mt-1 text-sm text-red-600 flex items-center"
        >
          <Icon name="i-heroicons-exclamation-circle" class="w-4 h-4 mr-1" />
          {{ errors.dueDate }}
        </p>
      </div>

      <!-- Long description -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Description détaillée
          <span class="text-gray-500 font-normal">(optionnel)</span>
        </label>
        <div class="relative">
          <textarea
            v-model="state.longDescription"
            placeholder="Ajoutez plus de détails sur cette tâche..."
            rows="4"
            :class="[
              'w-full px-4 py-3 border rounded-lg transition-all duration-200',
              'placeholder-gray-400 text-gray-900 resize-none',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              'hover:border-gray-400',
              errors.longDescription && touched.longDescription
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white',
            ]"
            @blur="touched.longDescription = true"
            :disabled="taskStore.loading"
          />
          <div class="absolute right-3 bottom-3">
            <span class="text-xs text-gray-500">
              {{ state.longDescription?.length || 0 }}/2000
            </span>
          </div>
        </div>
        <p
          v-if="errors.longDescription && touched.longDescription"
          class="mt-1 text-sm text-red-600 flex items-center"
        >
          <Icon name="i-heroicons-exclamation-circle" class="w-4 h-4 mr-1" />
          {{ errors.longDescription }}
        </p>
      </div>
    </form>

    <template #footer>
      <button
        type="button"
        :class="[
          'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
          'flex items-center gap-2',
          isFormValid && !taskStore.loading
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed',
        ]"
        @click="onSubmit"
        :disabled="!isFormValid || taskStore.loading"
      >
        <Icon
          v-if="taskStore.loading"
          name="i-heroicons-arrow-path"
          class="animate-spin h-5 w-5"
        />
        <Icon v-else name="i-heroicons-plus" class="w-5 h-5" />
        {{ taskStore.loading ? "Création..." : "Créer la tâche" }}
      </button>
    </template>
  </SimpleModal>
</template>
