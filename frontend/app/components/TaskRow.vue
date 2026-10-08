<script setup lang="ts">
import { priorityLabels, type Task } from "~/types/contracts";
const props = defineProps<{ task: Task; listName: string; busy?: boolean }>();
const emit = defineEmits<{
  complete: [completed: boolean];
  edit: [];
  remove: [];
  duplicate: [];
  step: [id: string, completed: boolean];
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
      icon="i-lucide-copy"
      :aria-label="`Copier ${task.shortDescription}`"
      :disabled="busy"
      @click="emit('duplicate')"
    />
    <UButton
      color="neutral"
      variant="ghost"
      icon="i-lucide-trash-2"
      :aria-label="`Supprimer ${task.shortDescription}`"
      :disabled="busy"
      @click="emit('remove')"
    />
    <details v-if="task.checklist.length" class="task-checklist">
      <summary>
        {{ task.checklist.filter((item) => item.completed).length }}/{{
          task.checklist.length
        }}
        étapes
      </summary>
      <label v-for="step in task.checklist" :key="step.id"
        ><input
          type="checkbox"
          :checked="step.completed"
          :disabled="busy"
          :aria-label="`Étape : ${step.text}`"
          @change="emit('step', step.id, !step.completed)"
        /><span :class="{ 'step-done': step.completed }">{{
          step.text
        }}</span></label
      >
    </details>
  </article>
</template>
