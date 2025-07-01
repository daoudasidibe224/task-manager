<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Barre de chargement -->
    <div
      v-if="authStore.isLoading"
      class="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse z-50"
    />

    <!-- Contenu principal -->
    <div
      class="transition-opacity duration-300"
      :class="{
        'opacity-0': authStore.isLoading,
        'opacity-100': !authStore.isLoading,
      }"
    >
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~/stores/auth.store";

const authStore = useAuthStore();
</script>
