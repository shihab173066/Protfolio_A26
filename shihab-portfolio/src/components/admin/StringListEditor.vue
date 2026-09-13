<script setup>
import AppIcon from '../AppIcon.vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, default: 'Items' },
  placeholder: { type: String, default: '' },
  multiline: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const commit = (next) => emit('update:modelValue', next)

function update(index, value) {
  const next = [...props.modelValue]
  next[index] = value
  commit(next)
}

function add() {
  commit([...props.modelValue, ''])
}

function remove(index) {
  commit(props.modelValue.filter((_, i) => i !== index))
}

function move(index, delta) {
  const target = index + delta
  if (target < 0 || target >= props.modelValue.length) return
  const next = [...props.modelValue]
  ;[next[index], next[target]] = [next[target], next[index]]
  commit(next)
}
</script>

<template>
  <div>
    <span class="label">{{ label }}</span>

    <div v-if="modelValue.length" class="grid gap-2">
      <div v-for="(value, index) in modelValue" :key="index" class="flex items-start gap-1.5">
        <textarea
          v-if="multiline"
          class="field min-h-[4.5rem]"
          :placeholder="placeholder"
          :value="value"
          @input="update(index, $event.target.value)"
        />
        <input
          v-else
          class="field"
          type="text"
          :placeholder="placeholder"
          :value="value"
          @input="update(index, $event.target.value)"
        />

        <div class="flex shrink-0 gap-1 pt-1">
          <button type="button" class="admin-mini" title="Move up" @click="move(index, -1)">
            <AppIcon name="up" :size="14" />
          </button>
          <button type="button" class="admin-mini" title="Move down" @click="move(index, 1)">
            <AppIcon name="down" :size="14" />
          </button>
          <button type="button" class="admin-mini admin-mini-danger" title="Remove" @click="remove(index)">
            <AppIcon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <p v-else class="rounded-lg border border-dashed border-ink-300 px-3 py-2.5 text-xs text-ink-400">
      Nothing here yet.
    </p>

    <button type="button" class="btn-ghost btn-sm mt-2" @click="add">
      <AppIcon name="plus" :size="14" />
      Add
    </button>
  </div>
</template>
