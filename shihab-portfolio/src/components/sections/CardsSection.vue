<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <article
      v-for="(item, i) in section.items"
      :key="item.id"
      v-reveal="i * 55"
      class="card group relative flex flex-col overflow-hidden p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
    >
      <span
        class="absolute inset-x-0 top-0 h-1 scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style="background-image: linear-gradient(90deg, var(--accent), #0f172a)"
        aria-hidden="true"
      />

      <div class="mb-4 flex items-start justify-between gap-3">
        <span class="grid h-10 w-10 place-items-center rounded-xl bg-ink-900 text-white">
          <AppIcon name="layers" :size="18" />
        </span>
        <span v-if="item.meta" class="chip bg-ink-50 text-[11px]">{{ item.meta }}</span>
      </div>

      <h3 class="text-base font-bold text-ink-900">{{ item.title }}</h3>
      <p v-if="item.subtitle" class="mt-0.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
        {{ item.subtitle }}
      </p>
      <p v-if="item.description" class="mt-3 flex-1 text-sm leading-6 text-ink-600">{{ item.description }}</p>

      <ul v-if="item.bullets?.length" class="mt-3 grid gap-1.5">
        <li v-for="(b, bi) in item.bullets" :key="bi" class="flex gap-2 text-sm text-ink-600">
          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style="background-color: var(--accent)" />
          <span>{{ b }}</span>
        </li>
      </ul>

      <ul v-if="item.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
        <li v-for="tag in item.tags" :key="tag" class="chip bg-ink-50 px-2.5 py-1 text-[11px]">{{ tag }}</li>
      </ul>

      <div v-if="item.links?.length" class="mt-4 flex flex-wrap gap-3 border-t border-ink-100 pt-4">
        <a
          v-for="link in item.links"
          :key="link.id"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1.5 text-sm font-semibold accent-text hover:underline"
        >
          {{ link.label }}
          <AppIcon name="external" :size="14" />
        </a>
      </div>
    </article>
  </div>
</template>
