<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <ol class="relative ml-1 space-y-6 border-l border-dashed border-ink-300 pl-6 sm:ml-3 sm:pl-10">
    <li v-for="(item, i) in section.items" :key="item.id" v-reveal="i * 60" class="relative">
      <span
        class="absolute -left-[1.9rem] top-6 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-accent-50 shadow sm:-left-[3.15rem]"
      >
        <span class="h-2 w-2 rounded-full" style="background-color: var(--accent)" />
      </span>

      <article class="card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-ink-900 sm:text-lg">{{ item.title }}</h3>
            <p v-if="item.subtitle" class="mt-0.5 text-sm font-semibold accent-text">{{ item.subtitle }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span v-if="item.badge" class="chip border-accent-200 bg-accent-50 accent-text">{{ item.badge }}</span>
            <span v-if="item.meta" class="chip bg-ink-50 font-mono text-[11px]">{{ item.meta }}</span>
          </div>
        </div>

        <p v-if="item.description" class="mt-3 text-xs font-medium text-ink-500">{{ item.description }}</p>

        <ul v-if="item.bullets?.length" class="mt-4 grid gap-2.5">
          <li v-for="(b, bi) in item.bullets" :key="bi" class="flex gap-2.5 text-sm leading-6 text-ink-600">
            <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style="background-color: var(--accent)" />
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
    </li>
  </ol>
</template>
