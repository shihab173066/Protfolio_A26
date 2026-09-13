<script setup>
defineProps({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  alt: { type: Boolean, default: false },
})
</script>

<template>
  <section :id="id" class="scroll-mt-24 py-16 sm:py-24" :class="alt ? 'bg-white' : ''">
    <div class="shell">
      <header v-reveal class="mb-10 max-w-2xl sm:mb-14">
        <span class="mb-3 block h-1 w-12 rounded-full" style="background-color: var(--accent)" aria-hidden="true" />
        <h2 class="text-2xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{{ title }}</h2>
        <p v-if="subtitle" class="mt-3 text-[15px] leading-7 text-ink-500">{{ subtitle }}</p>
      </header>
      <slot />
    </div>
  </section>
</template>
