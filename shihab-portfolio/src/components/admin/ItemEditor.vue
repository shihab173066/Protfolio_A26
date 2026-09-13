<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import StringListEditor from './StringListEditor.vue'
import LinkListEditor from './LinkListEditor.vue'

const props = defineProps({
  item: { type: Object, required: true },
  sectionType: { type: String, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
})

const emit = defineEmits(['update', 'remove', 'move'])

const open = ref(false)

// Which fields each section type actually renders.
const FIELDS = {
  about: ['title', 'description'],
  skills: ['title', 'badge', 'description', 'tags'],
  timeline: ['title', 'subtitle', 'meta', 'badge', 'description', 'bullets', 'tags', 'links'],
  cards: ['title', 'subtitle', 'meta', 'description', 'bullets', 'tags', 'links'],
  list: ['title', 'subtitle', 'meta', 'description', 'bullets', 'tags', 'links'],
  text: ['title', 'description'],
  contact: ['title', 'subtitle', 'meta', 'bullets'],
}

const LABELS = {
  about: { title: 'Strength', description: 'Short note (optional)' },
  skills: { title: 'Group name', badge: 'Icon', description: 'Description (optional)', tags: 'Skills' },
  timeline: { title: 'Role', subtitle: 'Company', meta: 'Period', badge: 'Employment type', description: 'Sub-note' },
  cards: { title: 'Project', subtitle: 'Client / company', meta: 'Badge', description: 'Description' },
  list: { title: 'Title', subtitle: 'Subtitle', meta: 'Period / meta', description: 'Description' },
  contact: { title: 'Name', subtitle: 'Role & company', meta: 'Label', bullets: 'Contact lines' },
}

const ICONS = ['code', 'server', 'shield', 'rocket', 'doc', 'tool', 'spark', 'board', 'users', 'layers', 'bolt', 'briefcase', 'cap']

const fields = computed(() => FIELDS[props.sectionType] || FIELDS.cards)
const has = (f) => fields.value.includes(f)
const labelFor = (f, fallback) => LABELS[props.sectionType]?.[f] || fallback

const patch = (key, value) => emit('update', { ...props.item, [key]: value })
</script>

<template>
  <article class="rounded-xl border border-ink-200 bg-white">
    <header class="flex items-center gap-2 p-3">
      <button type="button" class="admin-mini" :aria-expanded="open" @click="open = !open">
        <AppIcon :name="open ? 'up' : 'down'" :size="14" />
      </button>

      <button type="button" class="min-w-0 flex-1 text-left" @click="open = !open">
        <p class="truncate text-sm font-semibold text-ink-900">{{ item.title || 'Untitled entry' }}</p>
        <p v-if="item.subtitle" class="truncate text-xs text-ink-500">{{ item.subtitle }}</p>
      </button>

      <button type="button" class="admin-mini" title="Move up" :disabled="index === 0" @click="emit('move', -1)">
        <AppIcon name="up" :size="14" />
      </button>
      <button
        type="button"
        class="admin-mini"
        title="Move down"
        :disabled="index === total - 1"
        @click="emit('move', 1)"
      >
        <AppIcon name="down" :size="14" />
      </button>
      <button type="button" class="admin-mini admin-mini-danger" title="Delete entry" @click="emit('remove')">
        <AppIcon name="trash" :size="14" />
      </button>
    </header>

    <div v-if="open" class="grid gap-4 border-t border-ink-100 p-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div v-if="has('title')">
          <label class="label">{{ labelFor('title', 'Title') }}</label>
          <input class="field" type="text" :value="item.title" @input="patch('title', $event.target.value)" />
        </div>
        <div v-if="has('subtitle')">
          <label class="label">{{ labelFor('subtitle', 'Subtitle') }}</label>
          <input class="field" type="text" :value="item.subtitle" @input="patch('subtitle', $event.target.value)" />
        </div>
        <div v-if="has('meta')">
          <label class="label">{{ labelFor('meta', 'Meta') }}</label>
          <input class="field" type="text" :value="item.meta" @input="patch('meta', $event.target.value)" />
        </div>
        <div v-if="has('badge')">
          <label class="label">{{ labelFor('badge', 'Badge') }}</label>
          <select v-if="sectionType === 'skills'" class="field" :value="item.badge" @change="patch('badge', $event.target.value)">
            <option v-for="icon in ICONS" :key="icon" :value="icon">{{ icon }}</option>
          </select>
          <input v-else class="field" type="text" :value="item.badge" @input="patch('badge', $event.target.value)" />
        </div>
      </div>

      <div v-if="has('description')">
        <label class="label">{{ labelFor('description', 'Description') }}</label>
        <textarea
          class="field min-h-[5rem]"
          :value="item.description"
          @input="patch('description', $event.target.value)"
        />
      </div>

      <StringListEditor
        v-if="has('bullets')"
        :model-value="item.bullets"
        :label="labelFor('bullets', 'Bullet points')"
        placeholder="Achievement or responsibility"
        multiline
        @update:model-value="patch('bullets', $event)"
      />

      <StringListEditor
        v-if="has('tags')"
        :model-value="item.tags"
        :label="labelFor('tags', 'Tags')"
        placeholder="Vue.js"
        @update:model-value="patch('tags', $event)"
      />

      <LinkListEditor
        v-if="has('links')"
        :model-value="item.links"
        @update:model-value="patch('links', $event)"
      />
    </div>
  </article>
</template>
