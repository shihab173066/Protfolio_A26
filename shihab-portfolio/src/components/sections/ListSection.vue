<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <div class="grid gap-5 md:grid-cols-2">
    <article
      v-for="(item, i) in section.items"
      :key="item.id"
      v-reveal="i * 60"
      class="card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div class="flex items-start gap-4">
        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-50 accent-text">
          <AppIcon name="cap" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <h3 class="text-[15px] font-bold leading-snug text-ink-900">{{ item.title }}</h3>
          <p v-if="item.subtitle" class="mt-0.5 text-sm text-ink-500">{{ item.subtitle }}</p>
          <p v-if="item.meta" class="mt-1 font-mono text-[11px] uppercase tracking-wide text-ink-400">
            {{ item.meta }}
          </p>
        </div>
      </div>

      <p v-if="item.description" class="mt-4 text-sm leading-6 text-ink-600">{{ item.description }}</p>

      <ul v-if="item.bullets?.length" class="mt-4 grid gap-2 border-t border-ink-100 pt-4">
        <li v-for="(b, bi) in item.bullets" :key="bi" class="flex gap-2.5 text-sm text-ink-600">
          <span class="mt-0.5 shrink-0 accent-text"><AppIcon name="check" :size="14" :stroke-width="2.4" /></span>
          <span>{{ b }}</span>
        </li>
      </ul>

      <ul v-if="item.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
        <li v-for="tag in item.tags" :key="tag" class="chip bg-ink-50 px-2.5 py-1 text-[11px]">{{ tag }}</li>
      </ul>

      <div v-if="item.links?.length" class="mt-4 flex flex-wrap gap-3">
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
