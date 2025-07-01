<script setup lang="ts">
// Correction pour Nuxt UI v3.2.0
const isOpen = defineModel<boolean>({ default: false });

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmColor?: string;
  loading?: boolean;
}

interface Emits {
  (e: "confirm" | "cancel"): void;
}

const props = withDefaults(defineProps<Props>(), {
  confirmLabel: "Supprimer",
  cancelLabel: "Annuler",
  confirmColor: "red",
  loading: false,
});

const emit = defineEmits<Emits>();

function confirm() {
  emit("confirm");
  isOpen.value = false;
}

function cancel() {
  emit("cancel");
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
      <UButton color="gray" variant="outline" size="md" @click="cancel">
        {{ props.cancelLabel }}
      </UButton>
      <UButton
        color="red"
        variant="solid"
        size="md"
        :loading="props.loading"
        @click="confirm"
      >
        {{ props.confirmLabel }}
      </UButton>
    </template>
  </SimpleModal>
</template>
