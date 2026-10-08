<script setup lang="ts">
import type { User } from "~/types/contracts";
const user = useState<User | null>("task-user", () => null);
</script>
<template>
  <UApp
    ><NuxtPage
      :page-key="(route) => `${route.path}:${user?.id ?? 'anonymous'}`"
  /></UApp>
</template>
