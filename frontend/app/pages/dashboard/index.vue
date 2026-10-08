<script setup lang="ts">
import { z } from "zod";
import { userSchema, type Task, type TaskList } from "~/types/contracts";
useHead({ title: "Mon espace · Mes listes de tâches" });
const w = useWorkspace(),
  api = useTaskApi();
const route = useRoute();
const view = ref(
    typeof route.query.view === "string" ? route.query.view : "all",
  ),
  search = ref(""),
  sort = ref("due"),
  layout = ref("list"),
  navOpen = ref(false),
  notice = ref(""),
  operationError = ref(""),
  busy = ref(false);
watch(view, (value) =>
  navigateTo({ query: { ...route.query, view: value } }, { replace: true }),
);
watch(
  () => route.query.view,
  (value) => {
    view.value = typeof value === "string" ? value : "all";
  },
);
const taskOpen = ref(false),
  editingTask = ref<Task>(),
  listOpen = ref(false),
  editingList = ref<TaskList>(),
  listName = ref(""),
  profileOpen = ref(false);
const profile = reactive({
  firstname: "",
  lastname: "",
  email: "",
  password: "",
});
const confirm = ref<{
  kind: "task" | "list" | "account";
  id: string;
  title: string;
  detail: string;
}>();
const today = () => new Date().toLocaleDateString("en-CA");
const pending = computed(() => w.tasks.value.filter((t) => !t.completed));
const overdue = computed(() =>
  pending.value.filter((t) => t.dueDate && t.dueDate.slice(0, 10) < today()),
);
const completed = computed(() => w.tasks.value.filter((t) => t.completed));
const selectedList = computed(() =>
  w.lists.value.find((l) => l.id === view.value),
);
const title = computed(
  () =>
    selectedList.value?.name ??
    {
      all: "Vue d’ensemble",
      today: "Aujourd’hui",
      overdue: "En retard",
      done: "Terminées",
    }[view.value] ??
    "Vue d’ensemble",
);
const visible = computed(() => {
  let tasks = w.tasks.value;
  if (selectedList.value) tasks = selectedList.value.tasks;
  else if (view.value === "today")
    tasks = pending.value.filter((t) => t.dueDate?.slice(0, 10) === today());
  else if (view.value === "overdue") tasks = overdue.value;
  else if (view.value === "done") tasks = completed.value;
  const query = search.value.trim().toLocaleLowerCase("fr");
  tasks = tasks.filter((t) =>
    `${t.shortDescription} ${t.longDescription ?? ""}`
      .toLocaleLowerCase("fr")
      .includes(query),
  );
  return [...tasks].sort((a, b) =>
    sort.value === "priority"
      ? { HIGH: 0, NORMAL: 1, LOW: 2 }[a.priority] -
        { HIGH: 0, NORMAL: 1, LOW: 2 }[b.priority]
      : sort.value === "recent"
        ? b.createdAt.localeCompare(a.createdAt)
        : Number(a.completed) - Number(b.completed) ||
          (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"),
  );
});
const sections = computed(() =>
  layout.value === "board"
    ? [
        { label: "À faire", tasks: visible.value.filter((t) => !t.completed) },
        { label: "Terminées", tasks: visible.value.filter((t) => t.completed) },
      ]
    : [{ label: "", tasks: visible.value }],
);
const navItems = computed(() => [
  {
    id: "all",
    label: "Vue d’ensemble",
    icon: "i-lucide-layout-dashboard",
    count: w.tasks.value.length,
  },
  {
    id: "today",
    label: "Aujourd’hui",
    icon: "i-lucide-sun",
    count: pending.value.filter((t) => t.dueDate?.slice(0, 10) === today())
      .length,
  },
  {
    id: "overdue",
    label: "En retard",
    icon: "i-lucide-clock-3",
    count: overdue.value.length,
  },
  {
    id: "done",
    label: "Terminées",
    icon: "i-lucide-circle-check",
    count: completed.value.length,
  },
]);
const listLabel = (id: string) =>
  w.lists.value.find((l) => l.id === id)?.name ?? "";
function select(id: string) {
  view.value = id;
  navOpen.value = false;
  search.value = "";
}
function newList(list?: TaskList) {
  editingList.value = list;
  listName.value = list?.name ?? "";
  operationError.value = "";
  listOpen.value = true;
}
function newTask(task?: Task) {
  if (!w.lists.value.length) {
    newList();
    return;
  }
  editingTask.value = task;
  taskOpen.value = true;
}
async function action(fn: () => Promise<void>, message: string) {
  if (busy.value) return false;
  busy.value = true;
  operationError.value = "";
  notice.value = "";
  try {
    await fn();
    notice.value = message;
    return true;
  } catch (cause) {
    operationError.value = messageFrom(cause);
    return false;
  } finally {
    busy.value = false;
  }
}
async function saveList() {
  if (
    await action(async () => {
      if (editingList.value)
        await w.renameList(
          editingList.value.id,
          listName.value,
          editingList.value.updatedAt,
        );
      else await w.createList(listName.value);
    }, "Liste enregistrée.")
  ) {
    listOpen.value = false;
    if (!editingList.value)
      view.value =
        w.lists.value.find((l) => l.name === listName.value.trim())?.id ??
        "all";
  }
}
function openProfile() {
  if (w.user.value)
    Object.assign(profile, {
      firstname: w.user.value.firstname,
      lastname: w.user.value.lastname,
      email: w.user.value.email,
      password: "",
    });
  operationError.value = "";
  profileOpen.value = true;
}
async function saveProfile() {
  if (
    await action(async () => {
      const user = w.user.value;
      if (!user) return;
      await api.send(`user/${user.id}`, userSchema, "PATCH", {
        firstname: profile.firstname,
        lastname: profile.lastname,
        email: profile.email,
        expectedUpdatedAt: user.updatedAt,
        ...(profile.password ? { password: profile.password } : {}),
      });
      await w.load();
    }, "Profil enregistré.")
  )
    profileOpen.value = false;
}
async function removeConfirmed() {
  const target = confirm.value;
  if (!target) return;
  if (
    await action(async () => {
      if (target.kind === "task") await w.deleteTask(target.id);
      else if (target.kind === "list") {
        await w.removeList(target.id);
        view.value = "all";
      } else {
        await api.send(`user/${target.id}`, z.unknown(), "DELETE");
        w.user.value = null;
        w.lists.value = [];
        w.loaded.value = false;
        await navigateTo("/login");
      }
    }, "Suppression effectuée.")
  )
    confirm.value = undefined;
}
function exportData() {
  const data = {
    format: "mes-listes-de-taches",
    version: 1,
    exportedAt: new Date().toISOString(),
    lists: w.lists.value,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `mes-taches-${today()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  notice.value = "Export téléchargé. Conservez ce fichier dans un endroit sûr.";
}
onMounted(async () => {
  try {
    await w.load();
    if (!w.user.value) await navigateTo("/login");
  } catch {
    /* The visible error offers a retry. */
  }
});
</script>
<template>
  <div class="workspace">
    <div v-if="navOpen" class="nav-overlay" @click="navOpen = false" />
    <aside class="sidebar" :class="{ opened: navOpen }">
      <NuxtLink class="workspace-brand" to="/dashboard"
        ><span><UIcon name="i-lucide-list-checks" /></span>Mes listes de
        tâches</NuxtLink
      ><UButton
        class="close-nav"
        color="neutral"
        variant="ghost"
        icon="i-lucide-x"
        aria-label="Fermer la navigation"
        @click="navOpen = false"
      />
      <p class="sidebar-label">MON ESPACE</p>
      <nav aria-label="Vues des tâches">
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="{ active: view === item.id }"
          @click="select(item.id)"
        >
          <UIcon :name="item.icon" /><span>{{ item.label }}</span
          ><small>{{ item.count }}</small>
        </button>
      </nav>
      <div class="list-heading">
        <p class="sidebar-label">MES LISTES</p>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-plus"
          aria-label="Créer une liste"
          @click="newList()"
        />
      </div>
      <nav aria-label="Listes">
        <button
          v-for="list in w.lists.value"
          :key="list.id"
          :class="{ active: view === list.id }"
          @click="select(list.id)"
        >
          <span class="list-dot" /><span>{{ list.name }}</span
          ><small>{{ list.tasks.filter((t) => !t.completed).length }}</small>
        </button>
      </nav>
      <button
        v-if="!w.lists.value.length"
        class="add-first-list"
        @click="newList()"
      >
        Créer ma première liste
      </button>
      <div class="sidebar-bottom">
        <p>Un peu d’ordre.<br />De la place pour le reste.</p>
        <button class="profile-button" @click="openProfile">
          <span class="avatar">{{ w.user.value?.firstname.slice(0, 1) }}</span
          ><span
            ><strong
              >{{ w.user.value?.firstname }}
              {{ w.user.value?.lastname }}</strong
            ><small>Gérer mon compte</small></span
          ><UIcon name="i-lucide-settings" />
        </button>
      </div>
    </aside>
    <main class="workspace-main">
      <header class="workspace-top">
        <UButton
          class="open-nav"
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          aria-label="Ouvrir la navigation"
          @click="navOpen = true"
        />
        <p>
          {{
            new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })
          }}
        </p>
        <div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-download"
            aria-label="Exporter mes tâches"
            @click="exportData"
          /><UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-log-out"
            aria-label="Se déconnecter"
            :loading="busy"
            @click="action(w.logout, '')"
          />
        </div>
      </header>
      <div class="page-content">
        <div class="page-heading">
          <div>
            <p class="eyebrow">
              Bonjour {{ w.user.value?.firstname || "à vous" }}
            </p>
            <h1>{{ title }}</h1>
            <p>Tâches, priorités et échéances de votre agenda.</p>
          </div>
          <UButton icon="i-lucide-plus" size="lg" @click="newTask()"
            >Nouvelle tâche</UButton
          >
        </div>
        <div v-if="view === 'all'" class="summary-grid">
          <button @click="select('all')">
            <span>À faire</span><strong>{{ pending.length }}</strong
            ><UIcon name="i-lucide-list-todo" /></button
          ><button @click="select('overdue')">
            <span>En retard</span><strong>{{ overdue.length }}</strong
            ><UIcon name="i-lucide-clock-3" /></button
          ><button @click="select('done')">
            <span>Terminées</span><strong>{{ completed.length }}</strong
            ><UIcon name="i-lucide-circle-check" />
          </button>
        </div>
        <p v-if="notice" role="status" class="notice">{{ notice }}</p>
        <div
          v-if="operationError || w.error.value"
          role="alert"
          class="form-error"
        >
          {{ operationError || w.error.value
          }}<UButton
            v-if="w.error.value"
            variant="ghost"
            @click="action(w.load, 'Données actualisées.')"
            >Réessayer</UButton
          >
        </div>
        <section class="task-panel">
          <div class="task-toolbar">
            <label class="search-box"
              ><UIcon name="i-lucide-search" /><input
                v-model="search"
                type="search"
                placeholder="Rechercher une tâche"
                aria-label="Rechercher une tâche"
            /></label>
            <div class="toolbar-options">
              <select v-model="sort" aria-label="Trier les tâches">
                <option value="due">Échéance</option>
                <option value="priority">Priorité</option>
                <option value="recent">Plus récentes</option>
              </select>
              <div class="view-switch">
                <UButton
                  :variant="layout === 'list' ? 'soft' : 'ghost'"
                  color="neutral"
                  icon="i-lucide-list"
                  aria-label="Afficher en liste"
                  :aria-pressed="layout === 'list'"
                  @click="layout = 'list'"
                /><UButton
                  :variant="layout === 'board' ? 'soft' : 'ghost'"
                  color="neutral"
                  icon="i-lucide-columns-2"
                  aria-label="Afficher en tableau"
                  :aria-pressed="layout === 'board'"
                  @click="layout = 'board'"
                />
              </div>
            </div>
          </div>
          <div v-if="selectedList" class="selected-list-tools">
            <span
              >{{ selectedList.tasks.length }} tâche{{
                selectedList.tasks.length > 1 ? "s" : ""
              }}</span
            ><UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              @click="newList(selectedList)"
              >Renommer</UButton
            ><UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              @click="
                confirm = {
                  kind: 'list',
                  id: selectedList.id,
                  title: 'Supprimer cette liste ?',
                  detail: `${selectedList.name} et ses ${selectedList.tasks.length} tâches seront supprimées définitivement.`,
                }
              "
              >Supprimer la liste</UButton
            >
          </div>
          <div
            v-if="w.loading.value && !w.loaded.value"
            class="empty-state"
            role="status"
          >
            Chargement de vos tâches…
          </div>
          <div v-else-if="!visible.length" class="empty-state">
            <span
              ><UIcon :name="search ? 'i-lucide-search' : 'i-lucide-sprout'"
            /></span>
            <h2>
              {{
                search
                  ? "Aucune tâche trouvée"
                  : view === "done"
                    ? "Vos réussites auront leur place ici"
                    : view === "overdue"
                      ? "Tout est à jour"
                      : view === "today"
                        ? "La journée est ouverte"
                        : "Votre prochaine action commence ici"
              }}
            </h2>
            <p>
              {{
                search
                  ? "Essayez un autre mot."
                  : "Créez une tâche, ajoutez une échéance si nécessaire et avancez à votre rythme."
              }}
            </p>
            <UButton v-if="!search" variant="soft" @click="newTask()"
              >Ajouter une tâche</UButton
            >
          </div>
          <div
            v-else
            class="task-sections"
            :class="{ board: layout === 'board' }"
          >
            <section v-for="section in sections" :key="section.label">
              <h2 v-if="section.label" class="column-heading">
                {{ section.label }} <small>{{ section.tasks.length }}</small>
              </h2>
              <TaskRow
                v-for="task in section.tasks"
                :key="task.id"
                :task="task"
                :list-name="listLabel(task.listId)"
                :busy="busy"
                @edit="newTask(task)"
                @complete="
                  (value) =>
                    action(
                      () => w.completeTask(task.id, value, task.updatedAt),
                      value ? 'Tâche terminée.' : 'Tâche rouverte.',
                    )
                "
                @remove="
                  confirm = {
                    kind: 'task',
                    id: task.id,
                    title: 'Supprimer cette tâche ?',
                    detail: task.shortDescription,
                  }
                "
              />
              <p v-if="!section.tasks.length" class="empty-column">
                Aucune tâche dans cette colonne.
              </p>
            </section>
          </div>
        </section>
        <p class="workspace-footnote">
          Vos listes sont privées et enregistrées dans votre compte.
        </p>
      </div>
    </main>
    <TaskEditor
      :open="taskOpen"
      :task="editingTask"
      :lists="w.lists.value"
      :initial-list="selectedList?.id"
      @close="taskOpen = false"
      @saved="notice = 'Tâche enregistrée.'"
    />
    <UModal
      v-model:open="listOpen"
      :title="editingList ? 'Renommer la liste' : 'Nouvelle liste'"
      description="Regroupez vos tâches par projet ou par envie."
      ><template #body
        ><form id="list-form" class="editor-form" @submit.prevent="saveList">
          <label
            >Nom de la liste<input
              v-model="listName"
              autofocus
              required
              minlength="2"
              maxlength="100"
              placeholder="Travail, maison, idées…"
          /></label>
          <p v-if="operationError" role="alert" class="form-error">
            {{ operationError }}
          </p>
        </form></template
      ><template #footer
        ><div class="dialog-actions">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="busy"
            @click="listOpen = false"
            >Annuler</UButton
          ><UButton type="submit" form="list-form" :loading="busy"
            >Enregistrer la liste</UButton
          >
        </div></template
      ></UModal
    >
    <UModal
      v-model:open="profileOpen"
      title="Mon compte"
      description="Vos informations et la gestion de vos données."
      ><template #body
        ><form
          id="profile-form"
          class="editor-form"
          @submit.prevent="saveProfile"
        >
          <div class="field-grid">
            <label
              >Prénom<input
                v-model="profile.firstname"
                required
                maxlength="50" /></label
            ><label
              >Nom<input v-model="profile.lastname" required maxlength="50"
            /></label>
          </div>
          <label
            >Adresse e-mail<input
              v-model="profile.email"
              type="email"
              required
              maxlength="254" /></label
          ><label
            >Nouveau mot de passe<input
              v-model="profile.password"
              type="password"
              minlength="8"
              maxlength="72"
              autocomplete="new-password"
              placeholder="Laisser vide pour le conserver"
          /></label>
          <p class="field-help">
            Au moins 8 caractères, une majuscule, une minuscule et un chiffre.
          </p>
          <p v-if="operationError" role="alert" class="form-error">
            {{ operationError }}
          </p>
        </form>
        <div class="danger-zone">
          <h3>Supprimer mon compte</h3>
          <p>Cette action efface votre compte, vos listes et vos tâches.</p>
          <UButton
            color="error"
            variant="soft"
            @click="
              profileOpen = false;
              confirm = {
                kind: 'account',
                id: w.user.value?.id ?? '',
                title: 'Supprimer votre compte ?',
                detail:
                  'Toutes vos listes et tâches seront effacées définitivement.',
              };
            "
            >Supprimer mon compte</UButton
          >
        </div></template
      ><template #footer
        ><div class="dialog-actions">
          <UButton color="neutral" variant="ghost" @click="profileOpen = false"
            >Annuler</UButton
          ><UButton type="submit" form="profile-form" :loading="busy"
            >Enregistrer le profil</UButton
          >
        </div></template
      ></UModal
    >
    <UModal
      :open="!!confirm"
      :title="confirm?.title"
      :description="confirm?.detail"
      @update:open="
        (value) => {
          if (!value && !busy) confirm = undefined;
        }
      "
      ><template #body
        ><p>Cette suppression est définitive.</p>
        <p v-if="operationError" role="alert" class="form-error">
          {{ operationError }}
        </p></template
      ><template #footer
        ><div class="dialog-actions">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="busy"
            @click="confirm = undefined"
            >Annuler</UButton
          ><UButton color="error" :loading="busy" @click="removeConfirmed"
            >Confirmer la suppression</UButton
          >
        </div></template
      ></UModal
    >
  </div>
</template>
