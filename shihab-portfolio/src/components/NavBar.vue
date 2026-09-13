<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from './AppIcon.vue'
import { onAnchorClick } from '../utils/scroll'

const props = defineProps({
  profile: { type: Object, required: true },
  links: { type: Array, default: () => [] },
})

const scrolled = ref(false)
const open = ref(false)
const active = ref('')

let observer = null

function onScroll() {
  scrolled.value = window.scrollY > 24
}

async function observeSections() {
  await nextTick()
  observer?.disconnect()
  document.querySelectorAll('section[id]').forEach((el) => observer?.observe(el))
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) active.value = e.target.id
      })
    },
    { rootMargin: '-45% 0px -50% 0px' },
  )
  observeSections()
})

watch(() => props.links.map((l) => l.id).join(), observeSections)

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  observer?.disconnect()
})

const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
</script>

<template>
  <header
    class="no-print fixed inset-x-0 top-0 z-50 transition-all duration-300"
    :class="scrolled ? 'border-b border-ink-200/70 bg-white/85 backdrop-blur-xl' : 'bg-transparent'"
  >
    <nav class="shell flex h-16 items-center justify-between gap-4 sm:h-[4.5rem]">
      <a href="#top" class="group flex items-center gap-3" @click="onAnchorClick($event, 'top')">
        <span
          class="grid h-9 w-9 place-items-center rounded-xl text-sm font-extrabold text-white shadow-lift"
          style="background-image: linear-gradient(135deg, var(--accent), #0f172a)"
        >
          {{ initials(profile.name) }}
        </span>
        <span class="hidden text-sm font-bold tracking-tight text-ink-900 sm:block">
          {{ profile.name }}
        </span>
      </a>

      <ul class="hidden items-center gap-1 lg:flex">
        <li v-for="link in links" :key="link.id">
          <a
            :href="`#${link.id}`"
            class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
            :class="
              active === link.id ? 'bg-accent-50 accent-text' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
            "
            @click="onAnchorClick($event, link.id)"
          >
            {{ link.title }}
          </a>
        </li>
      </ul>

      <div class="flex items-center gap-2">
        <a
          v-if="profile.resumeUrl"
          :href="profile.resumeUrl"
          download
          class="btn-primary btn-sm hidden px-4 py-2 sm:inline-flex"
        >
          <AppIcon name="download" :size="15" />
          Resume
        </a>
        <RouterLink
          to="/admin"
          class="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-500 transition hover:text-ink-900"
          title="Admin panel"
          aria-label="Admin panel"
        >
          <AppIcon name="lock" :size="16" />
        </RouterLink>
        <button
          class="grid h-9 w-9 place-items-center rounded-lg border border-ink-200 bg-white text-ink-700 lg:hidden"
          :aria-expanded="open"
          aria-label="Toggle navigation"
          @click="open = !open"
        >
          <AppIcon :name="open ? 'close' : 'menu'" :size="18" />
        </button>
      </div>
    </nav>

    <Transition name="drawer">
      <div v-if="open" class="border-t border-ink-200 bg-white/95 backdrop-blur-xl lg:hidden">
        <ul class="shell grid gap-1 py-4">
          <li v-for="link in links" :key="link.id">
            <a
              :href="`#${link.id}`"
              class="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-100"
              @click="onAnchorClick($event, link.id); open = false"
            >
              {{ link.title }}
            </a>
          </li>
          <li v-if="profile.resumeUrl" class="pt-2">
            <a :href="profile.resumeUrl" download class="btn-primary w-full">
              <AppIcon name="download" :size="16" />
              Download resume
            </a>
          </li>
        </ul>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
