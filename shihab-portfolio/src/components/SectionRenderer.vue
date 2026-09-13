<script setup>
import { computed } from 'vue'
import AboutSection from './sections/AboutSection.vue'
import CardsSection from './sections/CardsSection.vue'
import ContactSection from './sections/ContactSection.vue'
import ListSection from './sections/ListSection.vue'
import SkillsSection from './sections/SkillsSection.vue'
import TextSection from './sections/TextSection.vue'
import TimelineSection from './sections/TimelineSection.vue'

const props = defineProps({
  section: { type: Object, required: true },
  profile: { type: Object, required: true },
})

const registry = {
  about: AboutSection,
  skills: SkillsSection,
  timeline: TimelineSection,
  cards: CardsSection,
  list: ListSection,
  text: TextSection,
  contact: ContactSection,
}

const component = computed(() => registry[props.section.type] || TextSection)
const bindings = computed(() =>
  props.section.type === 'contact'
    ? { section: props.section, profile: props.profile }
    : { section: props.section },
)
</script>

<template>
  <component :is="component" v-bind="bindings" />
</template>
