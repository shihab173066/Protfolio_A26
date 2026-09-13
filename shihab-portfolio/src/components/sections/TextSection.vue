<script setup>
defineProps({ section: { type: Object, required: true } })
</script>

<template>
  <div class="grid gap-6">
    <p v-if="section.body" v-reveal class="prose-body max-w-3xl">{{ section.body }}</p>

    <ul v-if="section.items?.length" v-reveal="80" class="grid gap-3">
      <li v-for="item in section.items" :key="item.id" class="card p-5">
        <h3 v-if="item.title" class="text-sm font-bold text-ink-900">{{ item.title }}</h3>
        <p v-if="item.description" class="mt-1 text-sm leading-6 text-ink-600">{{ item.description }}</p>
      </li>
    </ul>
  </div>
</template>
