<script setup>
import AppIcon from '../AppIcon.vue'

defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[1.35fr,0.65fr]">
    <div v-reveal class="prose-body">{{ section.body }}</div>

    <aside v-if="section.items?.length" v-reveal="120" class="card h-fit p-6">
      <h3 class="mb-4 text-xs font-bold uppercase tracking-wider text-ink-500">Core strengths</h3>
      <ul class="grid gap-2.5">
        <li v-for="item in section.items" :key="item.id" class="flex items-start gap-2.5 text-sm text-ink-700">
          <span class="mt-0.5 shrink-0 accent-text"><AppIcon name="check" :size="15" :stroke-width="2.4" /></span>
          <span>
            <span class="font-medium">{{ item.title }}</span>
            <span v-if="item.description" class="block text-xs text-ink-500">{{ item.description }}</span>
          </span>
        </li>
      </ul>
    </aside>
  </div>
</template>
