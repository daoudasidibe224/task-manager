<script setup lang="ts">
import {
  priorityLabels,
  type Task,
  type TaskList,
  type TaskDraft,
} from "~/types/contracts";
const props = defineProps<{
  open: boolean;
  task?: Task;
  lists: TaskList[];
  initialList?: string;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const workspace = useWorkspace();
const draft = reactive<TaskDraft>({
  shortDescription: "",
  longDescription: "",
  dueDate: "",
  priority: "NORMAL",
  listId: "",
});
const busy = ref(false),
  error = ref("");
watch(
  () => props.open,
  (open) => {
    if (open) {
      error.value = "";
      Object.assign(draft, {
        shortDescription: props.task?.shortDescription ?? "",
        longDescription: props.task?.longDescription ?? "",
        dueDate: props.task?.dueDate?.slice(0, 10) ?? "",
        priority: props.task?.priority ?? "NORMAL",
        listId:
          props.task?.listId ?? props.initialList ?? props.lists[0]?.id ?? "",
      });
    }
  },
);
async function save() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await workspace.saveTask(
      { ...draft },
      props.task?.id,
      props.task?.updatedAt,
    );
    emit("saved");
    emit("close");
  } catch (cause) {
    error.value = messageFrom(cause);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <UModal
    :open="open"
    :title="task ? 'Modifier la tâche' : 'Nouvelle tâche'"
    description="Un titre, une liste et ce qu’il faut pour passer à l’action."
    @update:open="
      (value) => {
        if (!value && !busy) emit('close');
      }
    "
  >
    <template #body
      ><form id="task-form" class="editor-form" @submit.prevent="save">
        <label
          >Titre<input
            v-model="draft.shortDescription"
            autofocus
            required
            maxlength="200"
            placeholder="Que voulez-vous faire ?"
        /></label>
        <label
          >Liste<select v-model="draft.listId" aria-label="Liste" required>
            <option v-for="list in lists" :key="list.id" :value="list.id">
              {{ list.name }}
            </option>
          </select></label
        >
        <label
          >Notes<textarea
            v-model="draft.longDescription"
            rows="4"
            maxlength="2000"
            placeholder="Détails, liens, prochaines étapes…"
          />
        </label>
        <div class="field-grid">
          <label>Échéance<input v-model="draft.dueDate" type="date" /></label
          ><label
            >Priorité<select v-model="draft.priority" aria-label="Priorité">
              <option
                v-for="(label, value) in priorityLabels"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select></label
          >
        </div>
        <p v-if="error" role="alert" class="form-error">{{ error }}</p>
      </form></template
    >
    <template #footer
      ><div class="dialog-actions">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="busy"
          @click="emit('close')"
          >Annuler</UButton
        ><UButton type="submit" form="task-form" :loading="busy"
          >Enregistrer la tâche</UButton
        >
      </div></template
    >
  </UModal>
</template>
