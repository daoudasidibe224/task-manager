<script setup lang="ts">
defineOptions({ name: "TaskErrorPage" });
import type { NuxtError } from "#app";
const props = defineProps<{ error: NuxtError }>();
useHead({
  title:
    props.error.statusCode === 404
      ? "Page introuvable · Mes listes de tâches"
      : "Erreur · Mes listes de tâches",
});
</script>
<template>
  <div class="auth-page error-page">
    <div class="product-brand">
      <span class="brand-symbol"
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
      >Mes listes de tâches
    </div>
    <main class="auth-grid">
      <section class="auth-panel">
        <span class="kicker">{{
          error.statusCode === 404 ? "Page introuvable" : "Ouverture impossible"
        }}</span>
        <h2>
          {{
            error.statusCode === 404
              ? "Cette page n’existe pas."
              : "La page n’a pas pu s’ouvrir."
          }}
        </h2>
        <p>
          {{
            error.statusCode === 404
              ? "Le lien a peut-être changé. Retrouvez vos tâches depuis votre espace."
              : "Réessayez depuis votre espace. Vos tâches enregistrées sont conservées."
          }}
        </p>
        <UButton
          class="auth-submit"
          @click="clearError({ redirect: '/dashboard' })"
          >Revenir à mon espace</UButton
        >
      </section>
    </main>
  </div>
</template>
