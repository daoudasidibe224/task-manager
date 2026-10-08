<script setup lang="ts">
import { priorityLabels, type Task } from "~/types/contracts";
const props = defineProps<{ task: Task; listName: string; busy?: boolean }>();
const emit = defineEmits<{
  complete: [completed: boolean];
  edit: [];
  remove: [];
}>();
const due = computed(() =>
  props.task.dueDate
    ? new Date(props.task.dueDate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : "",
);
const overdue = computed(
  () =>
    !props.task.completed &&
    !!props.task.dueDate &&
    props.task.dueDate.slice(0, 10) < new Date().toLocaleDateString("en-CA"),
);
</script>
<template>
  <article class="task-row" :class="{ finished: task.completed }">
    <input
      class="task-check"
      type="checkbox"
      :checked="task.completed"
      :disabled="busy"
      :aria-label="`${task.completed ? 'Rouvrir' : 'Terminer'} ${task.shortDescription}`"
      @change="emit('complete', !task.completed)"
    />
    <button class="task-content" @click="emit('edit')">
      <strong>{{ task.shortDescription }}</strong
      ><span v-if="task.longDescription" class="task-note">{{
        task.longDescription
      }}</span
      ><span class="task-meta"
        ><span>{{ listName }}</span
        ><span v-if="due" :class="{ overdue }"
          ><UIcon name="i-lucide-calendar-days" />{{ due }}</span
        ><span :class="`priority-${task.priority.toLowerCase()}`">{{
          priorityLabels[task.priority]
        }}</span></span
      >
    </button>
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-trash-2"
      :aria-label="`Supprimer ${task.shortDescription}`"
      :disabled="busy"
      @click="emit('remove')"
    />
  </article>
</template>
