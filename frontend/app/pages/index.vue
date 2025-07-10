<template>
  <div class="flex h-screen w-full items-center justify-center bg-gray-50">
    <div class="flex flex-col items-center space-y-4">
      <div
        class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"
      ></div>
      <p class="text-lg text-gray-600">Chargement...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: "empty",
});
</script>
