<script setup lang="ts">
import { useAuthStore } from "~/stores/auth.store";
import { loginSchema, type LoginSchema } from "~/utils/validation-schemas";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const authStore = useAuthStore();

const state = reactive<LoginSchema>({
  email: "daouda@gmail.com",
  password: "Daouda123",
});

const isLoading = ref(false);

async function onSubmit() {
  try {
    isLoading.value = true;
    const redirect = route.query.redirect as string | undefined;
    await authStore.login(state, redirect);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Logo/Titre -->
    <div class="text-center space-y-2">
      <div class="flex justify-center">
        <div
          class="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center"
        >
          <Icon
            name="i-heroicons-clipboard-document-list"
            class="w-6 h-6 text-white"
          />
        </div>
      </div>
      <h1 class="text-3xl font-bold text-gray-900">LibHeros Tasks</h1>
      <p class="text-gray-600">Connectez-vous à votre espace</p>
    </div>

    <!-- Formulaire de connexion -->
    <UCard class="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <UForm
        :schema="loginSchema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <UFormField
            label="Adresse email"
            name="email"
            class="space-y-2 clean-input"
          >
            <UInput
              v-model="state.email"
              type="email"
              placeholder="votre@email.com"
              :disabled="isLoading"
              required
              class="w-full"
              style="width: 100%"
            />
          </UFormField>

          <UFormField
            label="Mot de passe"
            name="password"
            class="space-y-2 clean-input"
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              :disabled="isLoading"
              required
              class="w-full"
              style="width: 100%"
            />
          </UFormField>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="isLoading"
          class="transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <template v-if="!isLoading">
            <Icon
              name="i-heroicons-arrow-right-on-rectangle"
              class="w-5 h-5 text-white"
            />
            Se connecter
          </template>
          <template v-else> Connexion en cours... </template>
        </UButton>
      </UForm>
    </UCard>

    <!-- Lien vers l'inscription -->
    <div class="text-center">
      <p class="text-gray-600">
        Pas encore de compte ?
        <NuxtLink
          to="/register"
          class="font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-200 underline decoration-2 underline-offset-4 hover:decoration-purple-600"
        >
          Créer un compte
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
