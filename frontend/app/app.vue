<template>
  <UApp>
    <NuxtLoadingIndicator color="primary" />
    <NuxtLayout>
      <NuxtPage :transition="{ name: 'page', mode: 'out-in' }" />
    </NuxtLayout>
    <UToast />
  </UApp>
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
