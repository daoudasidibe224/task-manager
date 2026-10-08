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
  initialDate?: string;
  copyFrom?: Task;
}>();
const emit = defineEmits<{ close: []; saved: [] }>();
const workspace = useWorkspace();
const draft = reactive<TaskDraft>({
  checklist: [],
  shortDescription: "",
  longDescription: "",
  dueDate: "",
  priority: "NORMAL",
  listId: "",
});
function addStep() {
  if (!stepText.value.trim() || draft.checklist.length >= 20) return;
  draft.checklist.push({
    id: crypto.randomUUID(),
    text: stepText.value.trim(),
    completed: false,
  });
  stepText.value = "";
}
const stepText = ref(""),
  requestId = ref("");
watch(
  () => JSON.stringify(draft),
  () => {
    if (!busy.value) requestId.value = crypto.randomUUID();
  },
  { flush: "sync" },
);
const busy = ref(false),
  error = ref("");
watch(
  () => props.open,
  (open) => {
    if (open) {
      error.value = "";
      const source = props.task ?? props.copyFrom;
      requestId.value = crypto.randomUUID();
      stepText.value = "";
      Object.assign(draft, {
        checklist:
          source?.checklist.map((item) => ({
            ...item,
            ...(props.copyFrom
              ? { id: crypto.randomUUID(), completed: false }
              : {}),
          })) ?? [],
        shortDescription: props.copyFrom
          ? `${source?.shortDescription ?? ""} (copie)`.slice(0, 200)
          : (source?.shortDescription ?? ""),
        longDescription: source?.longDescription ?? "",
        dueDate: source?.dueDate?.slice(0, 10) ?? props.initialDate ?? "",
        priority: source?.priority ?? "NORMAL",
        listId: source?.listId ?? props.initialList ?? props.lists[0]?.id ?? "",
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
      requestId.value,
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
    :title="
      task
        ? 'Modifier la tâche'
        : copyFrom
          ? 'Copier la tâche'
          : 'Nouvelle tâche'
    "
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
            :disabled="busy"
            autofocus
            required
            maxlength="200"
            placeholder="Que voulez-vous faire ?"
        /></label>
        <label
          >Liste<select
            v-model="draft.listId"
            :disabled="busy"
            aria-label="Liste"
            required
          >
            <option v-for="list in lists" :key="list.id" :value="list.id">
              {{ list.name }}
            </option>
          </select></label
        >
        <label
          >Notes<textarea
            v-model="draft.longDescription"
            :disabled="busy"
            rows="4"
            maxlength="2000"
            placeholder="Détails, liens, prochaines étapes…"
          />
        </label>
        <div class="field-grid">
          <label
            >Échéance<input
              v-model="draft.dueDate"
              :disabled="busy"
              type="date" /></label
          ><label
            >Priorité<select
              v-model="draft.priority"
              :disabled="busy"
              aria-label="Priorité"
            >
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
        <fieldset class="checklist-editor" :disabled="busy">
          <legend>
            Étapes à suivre
            <span
              >{{ draft.checklist.filter((item) => item.completed).length }}/{{
                draft.checklist.length
              }}</span
            >
          </legend>
          <div
            v-for="(step, index) in draft.checklist"
            :key="step.id"
            class="checklist-line"
          >
            <input
              v-model="step.completed"
              type="checkbox"
              :aria-label="`Terminer l’étape ${index + 1}`"
            />
            <input
              v-model="step.text"
              :aria-label="`Étape ${index + 1}`"
              required
              maxlength="200"
            />
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              :aria-label="`Retirer l’étape ${index + 1}`"
              @click="
                draft.checklist = draft.checklist.filter(
                  (item) => item.id !== step.id,
                )
              "
            />
          </div>
          <div class="checklist-line" v-if="draft.checklist.length < 20">
            <input
              v-model="stepText"
              aria-label="Nouvelle étape"
              maxlength="200"
              placeholder="Une action concrète…"
              @keydown.enter.prevent="addStep"
            /><UButton
              type="button"
              color="neutral"
              variant="outline"
              :disabled="!stepText.trim()"
              @click="addStep"
              >Ajouter</UButton
            >
          </div>
          <p class="field-hint">Jusqu’à 20 étapes, conservées avec la tâche.</p>
        </fieldset>
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
