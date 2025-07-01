<script setup lang="ts">
import { useAuthStore } from "~/stores/auth.store";
import { userSchema, type UserSchema } from "~/utils/validation-schemas";
import { computed, reactive, watchEffect } from "vue";
import { z } from "zod";

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

// Erreurs et champs touchés
const errors = reactive<Partial<Record<keyof UserSchema, string>>>({});
const touched = reactive<Partial<Record<keyof UserSchema, boolean>>>({});

function validateField(field: keyof UserSchema) {
  try {
    const fieldSchema = (userSchema.shape as Record<string, z.ZodType>)[field];
    fieldSchema.parse(state[field]);
    errors[field] = undefined;
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors[field] = error.errors[0]?.message;
    }
  }
}

// Watchers temps réel
watchEffect(() => {
  if (touched.firstname) validateField("firstname");
});
watchEffect(() => {
  if (touched.lastname) validateField("lastname");
});
watchEffect(() => {
  if (touched.email) validateField("email");
});
watchEffect(() => {
  if (touched.password) validateField("password");
});

const isFormValid = computed(() => {
  try {
    userSchema.parse(state);
    return true;
  } catch {
    return false;
  }
});

async function onSubmit() {
  try {
    isLoading.value = true;
    await authStore.register(state);
  } catch {
    /* Erreur déjà notifiée */
  } finally {
    isLoading.value = false;
  }
}

function handleSubmit() {
  Object.keys(state).forEach((key) => {
    touched[key as keyof UserSchema] = true;
    validateField(key as keyof UserSchema);
  });

  if (!isFormValid.value) return;

  onSubmit();
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
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Prénom & Nom -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Prénom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Prénom <span class="text-red-500">*</span>
            </label>
            <input
              v-model="state.firstname"
              placeholder="John"
              :class="[
                'w-full px-4 py-3 border rounded-lg transition-all duration-200',
                'placeholder-gray-400 text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'hover:border-gray-400',
                errors.firstname && touched.firstname
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white',
              ]"
              @blur="touched.firstname = true"
              :disabled="isLoading"
            />
            <p
              v-if="errors.firstname && touched.firstname"
              class="mt-1 text-sm text-red-600 flex items-center"
            >
              {{ errors.firstname }}
            </p>
          </div>

          <!-- Nom -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Nom <span class="text-red-500">*</span>
            </label>
            <input
              v-model="state.lastname"
              placeholder="Doe"
              :class="[
                'w-full px-4 py-3 border rounded-lg transition-all duration-200',
                'placeholder-gray-400 text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'hover:border-gray-400',
                errors.lastname && touched.lastname
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white',
              ]"
              @blur="touched.lastname = true"
              :disabled="isLoading"
            />
            <p
              v-if="errors.lastname && touched.lastname"
              class="mt-1 text-sm text-red-600 flex items-center"
            >
              {{ errors.lastname }}
            </p>
          </div>
        </div>

        <!-- Email & Mot de passe -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Adresse email <span class="text-red-500">*</span>
            </label>
            <input
              v-model="state.email"
              type="email"
              placeholder="votre@email.com"
              :class="[
                'w-full px-4 py-3 border rounded-lg transition-all duration-200',
                'placeholder-gray-400 text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'hover:border-gray-400',
                errors.email && touched.email
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white',
              ]"
              @blur="touched.email = true"
              :disabled="isLoading"
            />
            <p
              v-if="errors.email && touched.email"
              class="mt-1 text-sm text-red-600 flex items-center"
            >
              {{ errors.email }}
            </p>
          </div>

          <!-- Mot de passe -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe <span class="text-red-500">*</span>
            </label>
            <input
              v-model="state.password"
              type="password"
              placeholder="••••••••"
              :class="[
                'w-full px-4 py-3 border rounded-lg transition-all duration-200',
                'placeholder-gray-400 text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                'hover:border-gray-400',
                errors.password && touched.password
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300 bg-white',
              ]"
              @blur="touched.password = true"
              :disabled="isLoading"
            />
            <p
              v-if="errors.password && touched.password"
              class="mt-1 text-sm text-red-600 flex items-center"
            >
              {{ errors.password }}
            </p>
          </div>
        </div>

        <!-- Bouton -->
        <button
          type="submit"
          :class="[
            'w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2',
            isFormValid && !isLoading
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          ]"
          :disabled="!isFormValid || isLoading"
        >
          <svg
            v-if="!isLoading"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          <svg
            v-else
            class="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {{ isLoading ? "Création..." : "Créer mon compte" }}
        </button>
      </form>
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
