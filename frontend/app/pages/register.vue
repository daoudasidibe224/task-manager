<script setup lang="ts">
import { useAuthStore } from "~/stores/auth.store";
import { userSchema, type UserSchema } from "~/utils/validation-schemas";

definePageMeta({
  layout: "default",
});

const authStore = useAuthStore();

const state = reactive<UserSchema>({
  firstname: "",
  lastname: "",
  email: "",
  password: "",
});

const isLoading = ref(false);

async function onSubmit() {
  try {
    isLoading.value = true;
    await authStore.register(state);
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
          <Icon name="i-heroicons-user-plus" class="w-6 h-6 text-white" />
        </div>
      </div>
      <h1 class="text-3xl font-bold text-gray-900">Rejoignez LibHeros</h1>
      <p class="text-gray-600">Créez votre compte pour commencer</p>
    </div>

    <!-- Formulaire d'inscription -->
    <UCard class="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <UForm
        :schema="userSchema"
        :state="state"
        class="space-y-6"
        @submit="onSubmit"
      >
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField
              label="Prénom"
              name="firstname"
              class="space-y-2 clean-input"
            >
              <UInput
                v-model="state.firstname"
                placeholder="John"
                :disabled="isLoading"
                required
                class="w-full"
                style="width: 100%"
              />
            </UFormField>

            <UFormField
              label="Nom"
              name="lastname"
              class="space-y-2 clean-input"
            >
              <UInput
                v-model="state.lastname"
                placeholder="Doe"
                :disabled="isLoading"
                required
                class="w-full"
                style="width: 100%"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                minlength="8"
                class="w-full"
                style="width: 100%"
              />
            </UFormField>
          </div>
        </div>

        <UButton
          type="submit"
          block
          size="lg"
          :loading="isLoading"
          class="transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <template v-if="!isLoading">
            <Icon name="i-heroicons-user-plus" class="w-5 h-5 text-white" />
            Créer mon compte
          </template>
          <template v-else> Création en cours... </template>
        </UButton>
      </UForm>
    </UCard>

    <!-- Lien vers la connexion -->
    <div class="text-center">
      <p class="text-gray-600">
        Déjà un compte ?
        <NuxtLink
          to="/login"
          class="font-semibold text-blue-600 hover:text-purple-600 transition-colors duration-200 underline decoration-2 underline-offset-4 hover:decoration-purple-600"
        >
          Se connecter
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
