<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import NavBar from '../components/NavBar.vue'
import HeroSection from '../components/sections/HeroSection.vue'
import SectionShell from '../components/SectionShell.vue'
import SectionRenderer from '../components/SectionRenderer.vue'
import SiteFooter from '../components/SiteFooter.vue'
import AppIcon from '../components/AppIcon.vue'
import { useContent } from '../composables/useContent'

const { state } = useContent()

const profile = computed(() => state.content.profile)
const sections = computed(() => state.content.sections.filter((s) => s.visible !== false))
const navLinks = computed(() => sections.value.filter((s) => s.inNav !== false).map((s) => ({ id: s.id, title: s.title })))

const showTop = ref(false)
const onScroll = () => (showTop.value = window.scrollY > 700)

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div>
    <NavBar :profile="profile" :links="navLinks" />

    <main>
      <HeroSection :profile="profile" />

      <p v-if="state.error" class="shell mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        {{ state.error }}
      </p>

      <SectionShell
        v-for="(section, i) in sections"
        :id="section.id"
        :key="section.id"
        :title="section.title"
        :subtitle="section.subtitle"
        :alt="i % 2 === 0"
      >
        <SectionRenderer :section="section" :profile="profile" />
      </SectionShell>
    </main>

    <SiteFooter :profile="profile" />

    <Transition name="fade">
      <a
        v-if="showTop"
        href="#top"
        class="no-print fixed bottom-6 right-6 z-40 grid h-11 w-11 place-items-center rounded-full text-white shadow-lift transition hover:-translate-y-1"
        style="background-image: linear-gradient(135deg, var(--accent), #0f172a)"
        aria-label="Back to top"
      >
        <AppIcon name="up" :size="18" :stroke-width="2.2" />
      </a>
    </Transition>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
