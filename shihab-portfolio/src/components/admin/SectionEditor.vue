<script setup>
import AppIcon from '../AppIcon.vue'
import ItemEditor from './ItemEditor.vue'
import { SECTION_TYPES, emptyItem } from '../../data/defaultContent'

const props = defineProps({ section: { type: Object, required: true } })
const emit = defineEmits(['update'])

const patch = (key, value) => emit('update', { ...props.section, [key]: value })

function patchItem(index, nextItem) {
  patch('items', props.section.items.map((item, i) => (i === index ? nextItem : item)))
}

function removeItem(index) {
  patch('items', props.section.items.filter((_, i) => i !== index))
}

function moveItem(index, delta) {
  const target = index + delta
  if (target < 0 || target >= props.section.items.length) return
  const next = [...props.section.items]
  ;[next[index], next[target]] = [next[target], next[index]]
  patch('items', next)
}

function addItem() {
  patch('items', [...props.section.items, { ...emptyItem(), title: 'New entry' }])
}

// The id doubles as the anchor used by the navigation, so keep it URL safe.
function patchId(value) {
  patch(
    'id',
    value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section',
  )
}
</script>

<template>
  <div class="grid gap-6">
    <div class="card p-5 sm:p-6">
      <h3 class="mb-4 text-sm font-bold text-ink-900">Section settings</h3>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Heading</label>
          <input class="field" type="text" :value="section.title" @input="patch('title', $event.target.value)" />
        </div>
        <div>
          <label class="label">Layout type</label>
          <select class="field" :value="section.type" @change="patch('type', $event.target.value)">
            <option v-for="t in SECTION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="sm:col-span-2">
          <label class="label">Sub-heading</label>
          <input class="field" type="text" :value="section.subtitle" @input="patch('subtitle', $event.target.value)" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Body text</label>
          <textarea class="field min-h-[7rem]" :value="section.body" @input="patch('body', $event.target.value)" />
        </div>
        <div>
          <label class="label">Anchor id</label>
          <input class="field font-mono text-xs" type="text" :value="section.id" @input="patchId($event.target.value)" />
        </div>
        <div class="flex items-end gap-4 pb-1">
          <label class="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" class="h-4 w-4 rounded" :checked="section.visible" @change="patch('visible', $event.target.checked)" />
            Visible
          </label>
          <label class="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" class="h-4 w-4 rounded" :checked="section.inNav" @change="patch('inNav', $event.target.checked)" />
            Show in nav
          </label>
        </div>
      </div>
    </div>

    <div class="card p-5 sm:p-6">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 class="text-sm font-bold text-ink-900">Entries</h3>
          <p class="text-xs text-ink-500">{{ section.items.length }} item(s) in this section</p>
        </div>
        <button type="button" class="btn-ghost btn-sm" @click="addItem">
          <AppIcon name="plus" :size="14" />
          Add entry
        </button>
      </div>

      <div v-if="section.items.length" class="grid gap-2.5">
        <ItemEditor
          v-for="(item, index) in section.items"
          :key="item.id"
          :item="item"
          :index="index"
          :total="section.items.length"
          :section-type="section.type"
          @update="patchItem(index, $event)"
          @remove="removeItem(index)"
          @move="moveItem(index, $event)"
        />
      </div>

      <p v-else class="rounded-xl border border-dashed border-ink-300 px-4 py-6 text-center text-sm text-ink-400">
        No entries yet — add the first one.
      </p>
    </div>
  </div>
</template>
