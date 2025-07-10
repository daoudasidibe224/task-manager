<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmColor?: string;
  loading?: boolean;
}

interface Emits {
  (e: "confirm"): void;
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: "Supprimer",
  confirmColor: "red",
  loading: false,
});

const emit = defineEmits<Emits>();

function confirm() {
  emit("confirm");
  isOpen.value = false;
}
</script>

<template>
  <SimpleModal v-model="isOpen" :title="props.title">
    <div class="py-4">
      <p class="text-gray-600 leading-relaxed">
        {{ props.message }}
      </p>
    </div>

    <template #footer>
      <button
        type="button"
        :class="[
          'px-5 py-2.5 rounded-lg font-medium transition-all duration-200',
          'flex items-center gap-2',
          !props.loading
            ? 'bg-red-600 text-white hover:bg-red-700 shadow-sm hover:shadow'
            : 'bg-red-400 text-white cursor-not-allowed',
        ]"
        @click="confirm"
        :disabled="props.loading"
      >
        <Icon
          v-if="props.loading"
          name="i-heroicons-arrow-path"
          class="animate-spin h-5 w-5"
        />
        <Icon v-else name="i-heroicons-trash" class="w-5 h-5" />
        {{ props.confirmLabel }}
      </button>
    </template>
  </SimpleModal>
</template>
