<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    <article
      v-for="(group, i) in section.items"
      :key="group.id"
      v-reveal="i * 60"
      class="card group p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
    >
      <div class="mb-4 flex items-center gap-3">
        <span
          class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-50 accent-text transition group-hover:scale-110"
        >
          <AppIcon :name="group.badge || 'code'" :size="18" />
        </span>
        <h3 class="text-sm font-bold text-ink-900">{{ group.title }}</h3>
      </div>

      <p v-if="group.description" class="mb-3 text-sm text-ink-500">{{ group.description }}</p>

      <ul class="flex flex-wrap gap-1.5">
        <li v-for="tag in group.tags" :key="tag" class="chip bg-ink-50 px-2.5 py-1 text-[11px]">{{ tag }}</li>
      </ul>
    </article>
  </div>
</template>
