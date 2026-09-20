<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../AppIcon.vue'
import { useAuth } from '../../composables/useAuth'

const { authError, busy, login, credentialsConfigured, authMode } = useAuth()

const id = ref('')
const password = ref('')
const show = ref(false)

const firebaseMode = computed(() => authMode === 'firebase')
const idLabel = computed(() => (firebaseMode.value ? 'Admin email' : 'Admin ID'))
const idPlaceholder = computed(() => (firebaseMode.value ? 'you@example.com' : 'you@yoursite'))

async function submit() {
  await login(id.value.trim(), password.value)
}
</script>

<template>
  <div class="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-5 py-16">
    <div class="pointer-events-none absolute inset-0 grid-backdrop opacity-40" aria-hidden="true" />
    <div
      class="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full opacity-30 blur-3xl"
      style="background: radial-gradient(circle, var(--accent), transparent 65%)"
      aria-hidden="true"
    />

    <div class="relative w-full max-w-md">
      <RouterLink to="/" class="mb-6 inline-flex items-center gap-2 text-sm text-ink-400 transition hover:text-white">
        <AppIcon name="arrow" :size="15" class="rotate-180" />
        Back to portfolio
      </RouterLink>

      <form class="rounded-2xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl sm:p-9" @submit.prevent="submit">
        <span
          class="mb-5 grid h-12 w-12 place-items-center rounded-xl text-white shadow-lift"
          style="background-image: linear-gradient(135deg, var(--accent), #0f172a)"
        >
          <AppIcon name="lock" :size="20" />
        </span>

        <h1 class="text-2xl font-extrabold tracking-tight text-white">Content studio</h1>
        <p class="mt-1.5 text-sm text-ink-400">Sign in as Admin.</p>

        <div class="mt-7 grid gap-4">
          <div>
            <label class="label !text-ink-400" for="admin-id">{{ idLabel }}</label>
            <input
              id="admin-id"
              v-model="id"
              class="field border-white/10 bg-white/5 text-white placeholder:text-ink-500"
              type="text"
              :autocomplete="firebaseMode ? 'email' : 'username'"
              :placeholder="idPlaceholder"
              required
            />
          </div>

          <div>
            <label class="label !text-ink-400" for="admin-pass">Password</label>
            <div class="relative">
              <input
                id="admin-pass"
                v-model="password"
                class="field border-white/10 bg-white/5 pr-11 text-white placeholder:text-ink-500"
                :type="show ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-400 hover:text-white"
                :aria-label="show ? 'Hide password' : 'Show password'"
                @click="show = !show"
              >
                <AppIcon name="eye" :size="16" />
              </button>
            </div>
          </div>

          <p v-if="authError" role="alert" class="rounded-lg bg-rose-500/15 px-3 py-2 text-sm text-rose-200">
            {{ authError }}
          </p>

          <button type="submit" class="btn-primary w-full" :disabled="busy || !credentialsConfigured">
            <AppIcon name="lock" :size="16" />
            {{ busy ? 'Verifying…' : 'Sign in' }}
          </button>
        </div>

        <p
          v-if="!credentialsConfigured"
          class="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-[11px] leading-5 text-amber-200"
        >
          This build has no sign-in configured. Locally, copy
          <code class="rounded bg-black/30 px-1">.env.example</code> to
          <code class="rounded bg-black/30 px-1">.env.local</code>, fill in the
          <code class="rounded bg-black/30 px-1">VITE_FIREBASE_*</code> values and restart the dev
          server. On GitHub Pages, add those same values as repository secrets — see
          <code class="rounded bg-black/30 px-1">FIREBASE_SETUP.md</code>.
        </p>

        <p
          v-else-if="!firebaseMode"
          class="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-[11px] leading-5 text-amber-200"
        >
          Local storage mode — Firebase is not configured on this build, so anything you edit here
          is saved in this browser only and visitors will not see it.
        </p>
      </form>
    </div>
  </div>
</template>
