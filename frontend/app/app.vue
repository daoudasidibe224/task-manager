<template>
  <div>
    <NuxtLoadingIndicator color="primary" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UNotifications class="fixed bottom-4 right-4 z-[9999] max-w-sm w-full" />
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease-in-out;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}
</style>
