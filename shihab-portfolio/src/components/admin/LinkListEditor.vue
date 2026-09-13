<script setup>
import AppIcon from '../AppIcon.vue'
import { uid } from '../../data/defaultContent'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: 'Links' },
})

const emit = defineEmits(['update:modelValue'])

const commit = (next) => emit('update:modelValue', next)

function update(index, key, value) {
  const next = props.modelValue.map((link, i) => (i === index ? { ...link, [key]: value } : link))
  commit(next)
}

function add() {
  commit([...props.modelValue, { id: uid('link'), label: '', url: '' }])
}

function remove(index) {
  commit(props.modelValue.filter((_, i) => i !== index))
}
</script>

<template>
  <div>
    <span class="label">{{ label }}</span>

    <div v-if="modelValue.length" class="grid gap-2">
      <div v-for="(link, index) in modelValue" :key="link.id" class="flex items-center gap-1.5">
        <input
          class="field sm:max-w-[11rem]"
          type="text"
          placeholder="Label (GitHub)"
          :value="link.label"
          @input="update(index, 'label', $event.target.value)"
        />
        <input
          class="field"
          type="url"
          placeholder="https://…"
          :value="link.url"
          @input="update(index, 'url', $event.target.value)"
        />
        <button type="button" class="admin-mini admin-mini-danger shrink-0" title="Remove" @click="remove(index)">
          <AppIcon name="trash" :size="14" />
        </button>
      </div>
    </div>

    <p v-else class="rounded-lg border border-dashed border-ink-300 px-3 py-2.5 text-xs text-ink-400">No links.</p>

    <button type="button" class="btn-ghost btn-sm mt-2" @click="add">
      <AppIcon name="plus" :size="14" />
      Add link
    </button>
  </div>
</template>
