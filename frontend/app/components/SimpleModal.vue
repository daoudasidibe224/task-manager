<script setup lang="ts">
const isOpen = defineModel<boolean>({ default: false });

interface Props {
  title: string;
  icon?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <UModal v-model="isOpen" prevent-close>
    <UCard
      :ui="{
        ring: '',
        divide: 'divide-y divide-gray-100 dark:divide-gray-800',
        body: { padding: 'p-0 sm:p-0' },
        header: { padding: 'p-6 sm:px-6 sm:py-5' },
        footer: { padding: 'p-4 sm:p-5' },
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Icon
              v-if="props.icon"
              :name="props.icon"
              class="w-6 h-6 text-blue-600"
            />
            <h3 class="text-xl font-semibold leading-6 text-gray-900">
              {{ props.title }}
            </h3>
          </div>
          <UButton
            color="gray"
            variant="ghost"
            icon="i-heroicons-x-mark-20-solid"
            class="-my-1"
            @click="isOpen = false"
          />
        </div>
      </template>

      <div class="px-6 pb-6">
        <slot />
      </div>

      <template #footer>
        <div class="flex justify-end items-center gap-3">
          <slot name="footer" />
        </div>
      </template>
    </UCard>
  </UModal>
</template>
