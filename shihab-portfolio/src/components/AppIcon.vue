<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
  strokeWidth: { type: [Number, String], default: 1.75 },
})

// Simple geometric 24x24 stroke icons — no external icon dependency.
const paths = {
  code: ['M9 7l-5 5 5 5', 'M15 7l5 5-5 5'],
  server: ['M4 5h16v5H4z', 'M4 14h16v5H4z', 'M8 7.5h.01', 'M8 16.5h.01'],
  shield: ['M12 3l7 3v5.5c0 4-2.9 7.3-7 8.5-4.1-1.2-7-4.5-7-8.5V6z', 'M9.3 12l1.9 1.9 3.6-3.7'],
  rocket: ['M5 19l2-4 3 3-4 2z', 'M9 15c5-1 9-5 10-11-6 1-10 5-11 10', 'M9 15l-2-2'],
  doc: ['M7 3h7l4 4v14H7z', 'M14 3v4h4', 'M10 12h6', 'M10 16h6'],
  tool: ['M12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z', 'M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8'],
  spark: ['M12 3l1.9 5.6L19.5 12l-5.6 1.9L12 21l-1.9-7.1L4.5 12l5.6-3.4z'],
  board: ['M4 5h16v14H4z', 'M9 5v14', 'M15 5v14'],
  users: ['M9 11a3.2 3.2 0 100-6.4A3.2 3.2 0 009 11z', 'M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5', 'M16 5.4a3 3 0 010 5.9', 'M17 14.8c2 .6 3.5 2.4 3.5 4.7'],
  mail: ['M3.5 6h17v12h-17z', 'M3.5 7l8.5 6 8.5-6'],
  phone: ['M6 3.5h3l1.5 4-2 1.5a12 12 0 006.5 6.5l1.5-2 4 1.5v3a2 2 0 01-2.2 2A17 17 0 014 5.7 2 2 0 016 3.5z'],
  pin: ['M12 21s7-5.7 7-11a7 7 0 10-14 0c0 5.3 7 11 7 11z', 'M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z'],
  download: ['M12 3.5v11', 'M7.5 10.5l4.5 4.5 4.5-4.5', 'M4.5 19.5h15'],
  external: ['M14 4h6v6', 'M20 4l-8.5 8.5', 'M18 14v5.5H4.5V6H10'],
  link: ['M10.5 13.5a4 4 0 005.7 0l2.6-2.6a4 4 0 00-5.7-5.7L11.7 6.6', 'M13.5 10.5a4 4 0 00-5.7 0l-2.6 2.6a4 4 0 005.7 5.7l1.4-1.4'],
  menu: ['M4 7h16', 'M4 12h16', 'M4 17h16'],
  close: ['M6 6l12 12', 'M18 6L6 18'],
  arrow: ['M4.5 12h15', 'M13.5 6l6 6-6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  trash: ['M4.5 7h15', 'M9.5 7V4.5h5V7', 'M6.5 7l1 13h9l1-13', 'M10 11v6M14 11v6'],
  up: ['M6 14.5l6-6 6 6'],
  down: ['M6 9.5l6 6 6-6'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 017 0v3', 'M12 14.5v2.5'],
  save: ['M5 5h11l3 3v11H5z', 'M8.5 5v5h7V5', 'M8.5 19v-5h7v5'],
  logout: ['M14 5.5H6v13h8', 'M17 8.5l3.5 3.5-3.5 3.5', 'M20 12h-9'],
  eye: ['M2.8 12S6.5 6 12 6s9.2 6 9.2 6-3.7 6-9.2 6-9.2-6-9.2-6z', 'M12 14.6a2.6 2.6 0 100-5.2 2.6 2.6 0 000 5.2z'],
  edit: ['M4.5 19.5h4L19 9a2.5 2.5 0 10-3.5-3.5L5 16v3.5z', 'M14.5 6.5l3 3'],
  refresh: ['M20 12a8 8 0 10-2.4 5.7', 'M20 6v5h-5'],
  upload: ['M12 20V9', 'M7.5 13l4.5-4.5L16.5 13', 'M4.5 4.5h15'],
  copy: ['M9 9h11v11H9z', 'M15 9V4H4v11h5'],
  layers: ['M12 3l9 4.5-9 4.5-9-4.5z', 'M3 12.5l9 4.5 9-4.5', 'M3 17l9 4.5 9-4.5'],
  bolt: ['M13 3L5 13.5h6L10 21l8-10.5h-6z'],
  briefcase: ['M3.5 8h17v11h-17z', 'M9 8V5.5h6V8', 'M3.5 12.5h17'],
  cap: ['M12 4l9 4.5-9 4.5-9-4.5z', 'M7 11v4.5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V11'],
}

const list = computed(() => paths[props.name] || paths.link)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke-width="strokeWidth"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path v-for="(d, i) in list" :key="i" :d="d" />
  </svg>
</template>
