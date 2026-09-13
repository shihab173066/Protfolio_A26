<script setup>
import AppIcon from './AppIcon.vue'

defineProps({ profile: { type: Object, required: true } })

const year = new Date().getFullYear()
</script>

<template>
  <footer class="no-print border-t border-ink-200 bg-ink-900 py-10 text-ink-300">
    <div class="shell flex flex-col items-center justify-between gap-6 sm:flex-row">
      <div class="text-center sm:text-left">
        <p class="text-sm font-bold text-white">{{ profile.name }}</p>
        <p class="mt-1 text-xs text-ink-400">
          © {{ year }} · Built with Vue 3, Tailwind CSS &amp; Firebase
        </p>
      </div>

      <ul class="flex flex-wrap items-center justify-center gap-2">
        <li v-for="social in profile.socials" :key="social.id">
          <a
            :href="social.url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-ink-200 transition hover:border-white/40 hover:text-white"
          >
            <AppIcon :name="social.icon || 'link'" :size="14" />
            {{ social.label }}
          </a>
        </li>
      </ul>
    </div>
  </footer>
</template>
