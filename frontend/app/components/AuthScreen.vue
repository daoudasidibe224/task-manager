<script setup lang="ts">
const props = defineProps<{ register?: boolean }>();
const workspace = useWorkspace();
const fields = reactive({
  firstname: "",
  email: "",
  password: "",
});
const ready = ref(false);
const errorTarget = ref<HTMLParagraphElement>();
const busy = ref(false),
  error = ref(""),
  visible = ref(false);
async function submit() {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    if (props.register) {
      await workspace.register({
        email: fields.email,
        password: fields.password,
        ...(fields.firstname.trim()
          ? { firstname: fields.firstname.trim() }
          : {}),
      });
    } else
      await workspace.login({ email: fields.email, password: fields.password });
  } catch (cause) {
    error.value = messageFrom(cause);
    await nextTick();
    errorTarget.value?.focus();
  } finally {
    busy.value = false;
  }
}
onMounted(async () => {
  try {
    await workspace.load();
    if (workspace.user.value) await navigateTo("/dashboard");
  } catch (cause) {
    error.value = messageFrom(cause);
  } finally {
    ready.value = true;
  }
});
</script>
<template>
  <main
    v-if="!ready || workspace.user.value"
    class="loading-screen"
    role="status"
  >
    <span class="product-brand"
      ><span class="brand-symbol"><UIcon name="i-lucide-list-checks" /></span
      >Mes listes de tâches</span
    >
    <p>Ouverture de votre espace…</p>
    <span class="loading-line" aria-hidden="true" />
  </main>
  <div v-else class="auth-page">
    <NuxtLink class="product-brand" to="/"
      ><span class="brand-symbol"
        ><svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="m3 5 2 2 4-4m-6 11 2 2 4-4m4-7h8m-8 9h8M3 21h18"
          /></svg></span
      >Mes listes de tâches</NuxtLink
    >
    <main class="auth-grid">
      <aside class="auth-intro">
        <span class="kicker">Votre espace personnel</span>
        <h1>Un agenda pour<br />vos listes.</h1>
        <p>
          Notez ce qui compte, choisissez une échéance et avancez étape par
          étape.
        </p>
        <ul>
          <li>
            <UIcon name="i-lucide-list-checks" />Des listes et des étapes à
            cocher
          </li>
          <li>
            <UIcon name="i-lucide-calendar-days" />Une semaine pour vos
            échéances
          </li>
          <li>
            <UIcon name="i-lucide-lock-keyhole" />Un compte privé, sur tous vos
            appareils
          </li>
        </ul>
      </aside>
      <section class="auth-panel">
        <span class="kicker">{{
          register ? "Bienvenue" : "Heureux de vous retrouver"
        }}</span>
        <h2>{{ register ? "Créer votre compte" : "Se connecter" }}</h2>
        <p>
          {{
            register
              ? "Créez votre espace pour suivre vos listes et vos échéances."
              : "Accédez à vos listes privées et reprenez vos tâches."
          }}
        </p>
        <form @submit.prevent="submit">
          <label for="email"
            >Adresse e-mail<input
              id="email"
              v-model="fields.email"
              type="email"
              name="email"
              autocomplete="email"
              maxlength="100"
              required
              :disabled="busy"
              placeholder="vous@exemple.fr"
          /></label>
          <label for="password"
            >Mot de passe<span class="password-field"
              ><input
                id="password"
                aria-label="Mot de passe"
                v-model="fields.password"
                :type="visible ? 'text' : 'password'"
                :autocomplete="register ? 'new-password' : 'current-password'"
                :minlength="register ? 8 : undefined"
                maxlength="72"
                required
                :disabled="busy"
              /><button
                type="button"
                :aria-label="
                  visible
                    ? 'Masquer le mot de passe'
                    : 'Afficher le mot de passe'
                "
                @click="visible = !visible"
              >
                {{ visible ? "Masquer" : "Voir" }}
              </button></span
            ></label
          >
          <p v-if="register" class="field-hint">
            Au moins 8 caractères, une majuscule, une minuscule et un chiffre.
          </p>
          <details v-if="register">
            <summary>Choisir un prénom (facultatif)</summary>
            <label for="firstname"
              >Prénom (facultatif)<input
                id="firstname"
                v-model="fields.firstname"
                autocomplete="given-name"
                maxlength="50"
                :disabled="busy"
                placeholder="À compléter plus tard si vous préférez"
            /></label>
          </details>
          <p
            v-if="error"
            ref="errorTarget"
            tabindex="-1"
            class="form-error"
            role="alert"
          >
            {{ error }}
          </p>
          <UButton
            class="auth-submit"
            type="submit"
            color="primary"
            size="lg"
            :loading="busy"
            trailing-icon="i-lucide-arrow-right"
            >{{ register ? "Créer mon compte" : "Se connecter" }}</UButton
          >
        </form>
        <div class="auth-switch">
          <span>{{ register ? "Déjà un compte ?" : "Première visite ?" }}</span
          ><NuxtLink :to="register ? '/login' : '/register'">{{
            register ? "Se connecter" : "Créer un compte"
          }}</NuxtLink>
        </div>
      </section>
    </main>
    <footer class="auth-footer">
      Vos listes sont privées. Vos données restent dans votre compte.
    </footer>
  </div>
</template>
