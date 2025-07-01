<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });

interface Props {
  title: string;
  icon?: string;
}

const props = defineProps<Props>();

function close() {
  isOpen.value = false;
}
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    leave-active-class="transition-all duration-200 ease-in"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop avec flou -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm"
          @click="close"
        />
      </Transition>

      <!-- Modal avec animation -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 scale-95 translate-y-4"
        leave-to-class="opacity-0 scale-95 translate-y-4"
      >
        <div
          v-if="isOpen"
          class="relative bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 transform"
          @click.stop
        >
          <!-- Header avec style amélioré -->
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-3">
              <Icon
                v-if="props.icon"
                :name="props.icon"
                class="w-6 h-6 text-black custom-icon"
              />
              <h3 class="text-xl font-bold text-gray-900 tracking-tight">
                {{ props.title }}
              </h3>
            </div>
            <UButton color="gray" variant="outline" size="md" @click="close">
              Annuler
            </UButton>
          </div>

          <!-- Content avec padding amélioré -->
          <div class="mb-6">
            <slot />
          </div>

          <!-- Footer avec espacement amélioré -->
          <div class="flex gap-3 justify-end">
            <slot name="footer" />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
