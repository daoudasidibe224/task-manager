<script setup lang="ts">
interface Props {
  show: boolean;
  zIndex?: number;
}

const props = withDefaults(defineProps<Props>(), {
  zIndex: 1000,
});

interface Emits {
  (e: "close"): void;
}

const emit = defineEmits<Emits>();

// Fermer la modale en cliquant sur l'overlay
function handleOverlayClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    emit("close");
  }
}

// Gérer l'échappement
function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("close");
  }
}

// Écouter les événements clavier quand la modale est ouverte
watch(
  () => props.show,
  (isOpen) => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeydown);
      // Empêcher le scroll du body
      document.body.style.overflow = "hidden";
    } else {
      document.removeEventListener("keydown", handleKeydown);
      // Restaurer le scroll du body
      document.body.style.overflow = "";
    }
  }
);

// Nettoyer les événements au démontage
onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 flex items-center justify-center p-4"
        :style="{ zIndex: props.zIndex }"
        @click="handleOverlayClick"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          aria-hidden="true"
        />

        <!-- Contenu de la modale -->
        <div
          class="relative w-full max-w-lg max-h-[90vh] overflow-auto"
          role="dialog"
          aria-modal="true"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Styles additionnels pour s'assurer que la modale est bien visible */
[role="dialog"] {
  animation: modalSlideIn 0.2s ease-out;
}

@keyframes modalSlideIn {
  from {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}
</style>
