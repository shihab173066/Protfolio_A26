<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps({
  profile: { type: Object, required: true },
})

const photoOk = ref(true)
watch(
  () => props.profile.photoUrl,
  () => (photoOk.value = true),
)

const initials = () =>
  (props.profile.name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

// Typewriter cycle through the role list.
const typed = ref('')
let timer = null
let roleIndex = 0
let charIndex = 0
let deleting = false

function tick() {
  const roles = props.profile.roles?.length ? props.profile.roles : [props.profile.role || '']
  const current = roles[roleIndex % roles.length] || ''
  charIndex += deleting ? -1 : 1
  typed.value = current.slice(0, Math.max(charIndex, 0))

  let delay = deleting ? 35 : 70
  if (!deleting && charIndex >= current.length) {
    deleting = true
    delay = 1600
  } else if (deleting && charIndex <= 0) {
    deleting = false
    roleIndex += 1
    delay = 320
  }
  timer = setTimeout(tick, delay)
}

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    typed.value = props.profile.roles?.[0] || props.profile.role || ''
    return
  }
  tick()
})

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <section id="top" class="relative overflow-hidden pt-28 sm:pt-36">
    <div class="pointer-events-none absolute inset-0 grid-backdrop" aria-hidden="true" />
    <div
      class="pointer-events-none absolute -top-28 right-[-10%] h-[26rem] w-[26rem] rounded-full opacity-25 blur-3xl"
      style="background: radial-gradient(circle, var(--accent), transparent 65%)"
      aria-hidden="true"
    />

    <div class="shell relative grid items-center gap-12 pb-16 lg:grid-cols-[1.15fr,0.85fr] lg:pb-24">
      <div v-reveal>
        <p class="chip mb-5 border-accent-200 bg-accent-50 accent-text">
          <span class="relative flex h-2 w-2">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
            <span class="relative inline-flex h-2 w-2 rounded-full bg-current" />
          </span>
          {{ profile.availability || 'Available for work' }}
        </p>

        <h1 class="text-4xl font-extrabold leading-[1.08] tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
          {{ profile.name }}
        </h1>

        <p class="mt-4 flex min-h-[2.25rem] items-center text-lg font-semibold sm:text-2xl">
          <span class="accent-text">{{ typed }}</span>
          <span class="ml-1 inline-block h-6 w-[3px] animate-pulse bg-current align-middle accent-text sm:h-7" />
        </p>

        <p class="mt-5 max-w-xl text-[15px] leading-7 text-ink-600 sm:text-base">
          {{ profile.tagline }}
        </p>

        <div class="mt-8 flex flex-wrap gap-3">
          <a v-if="profile.resumeUrl" :href="profile.resumeUrl" download class="btn-primary">
            <AppIcon name="download" :size="17" />
            Download resume
          </a>
          <a href="#contact" class="btn-ghost">
            <AppIcon name="mail" :size="17" />
            Hire me
          </a>
        </div>

        <ul class="mt-8 flex flex-wrap items-center gap-2">
          <li v-for="social in profile.socials" :key="social.id">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener noreferrer"
              class="chip transition hover:-translate-y-0.5 hover:border-ink-400 hover:text-ink-900"
            >
              <AppIcon :name="social.icon || 'link'" :size="14" />
              {{ social.label }}
            </a>
          </li>
        </ul>
      </div>

      <div v-reveal="120" class="relative mx-auto w-full max-w-sm">
        <div
          class="absolute -inset-4 rounded-[2.5rem] opacity-20 blur-2xl"
          style="background-image: linear-gradient(135deg, var(--accent), #0f172a)"
          aria-hidden="true"
        />
        <div class="relative animate-float">
          <div class="overflow-hidden rounded-[2rem] border border-white bg-white p-2 shadow-lift">
            <img
              v-if="photoOk && profile.photoUrl"
              :src="profile.photoUrl"
              :alt="`Portrait of ${profile.name}`"
              class="aspect-[4/5] w-full rounded-[1.6rem] object-cover"
              loading="eager"
              decoding="async"
              @error="photoOk = false"
            />
            <div
              v-else
              class="grid aspect-[4/5] w-full place-items-center rounded-[1.6rem] text-5xl font-extrabold text-white"
              style="background-image: linear-gradient(135deg, var(--accent), #0f172a)"
            >
              {{ initials() }}
            </div>
          </div>

          <div class="card absolute -bottom-6 -left-4 flex items-center gap-2.5 px-4 py-3 sm:-left-8">
            <span class="grid h-8 w-8 place-items-center rounded-lg bg-accent-50 accent-text">
              <AppIcon name="code" :size="16" />
            </span>
            <span class="text-xs font-semibold text-ink-800">Vue · Django · Playwright</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="profile.stats?.length" class="shell relative pb-16 lg:pb-24">
      <dl v-reveal class="card grid grid-cols-2 divide-ink-200 sm:grid-cols-4 sm:divide-x">
        <div v-for="stat in profile.stats" :key="stat.id" class="px-6 py-6 text-center">
          <dt class="text-3xl font-extrabold tracking-tight text-ink-900">{{ stat.value }}</dt>
          <dd class="mt-1 text-xs font-medium uppercase tracking-wider text-ink-500">{{ stat.label }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>
