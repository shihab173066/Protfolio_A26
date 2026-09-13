<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import AdminLogin from '../components/admin/AdminLogin.vue'
import ProfileEditor from '../components/admin/ProfileEditor.vue'
import SectionEditor from '../components/admin/SectionEditor.vue'
import { useAuth } from '../composables/useAuth'
import { importContent, resetContent, saveContent, useContent } from '../composables/useContent'
import { SECTION_TYPES, emptySection } from '../data/defaultContent'
import { isFirebaseConfigured } from '../firebase'

const { signedIn, logout } = useAuth()
const { state } = useContent()

const clone = (value) => JSON.parse(JSON.stringify(value))

const draft = ref(clone(state.content))
const activeTab = ref('profile')
const toast = ref('')
const showAdd = ref(false)
const newType = ref('cards')
const importInput = ref(null)

const dirty = computed(() => JSON.stringify(draft.value) !== JSON.stringify(state.content))

// Pull in remote updates whenever there is nothing unsaved to overwrite.
watch(
  () => state.content,
  (next) => {
    if (!dirty.value) draft.value = clone(next)
  },
  { deep: true },
)

const activeSection = computed(() => draft.value.sections.find((s) => s.id === activeTab.value) || null)

function flash(message) {
  toast.value = message
  setTimeout(() => (toast.value = ''), 2600)
}

async function save() {
  const result = await saveContent(draft.value)
  flash(result.ok ? (isFirebaseConfigured ? 'Published to Firebase.' : 'Saved to this browser.') : result.error)
}

function discard() {
  draft.value = clone(state.content)
  flash('Unsaved changes discarded.')
}

async function factoryReset() {
  if (!confirm('Replace all content with the original résumé defaults? This cannot be undone.')) return
  await resetContent()
  draft.value = clone(state.content)
  flash('Content reset to defaults.')
}

function updateSection(next) {
  draft.value.sections = draft.value.sections.map((s) => (s.id === activeTab.value ? next : s))
  if (next.id !== activeTab.value) activeTab.value = next.id
}

function addSection() {
  const section = emptySection(newType.value)
  draft.value.sections.push(section)
  activeTab.value = section.id
  showAdd.value = false
}

function removeSection(id) {
  const section = draft.value.sections.find((s) => s.id === id)
  if (!confirm(`Delete the “${section?.title}” section and all of its entries?`)) return
  draft.value.sections = draft.value.sections.filter((s) => s.id !== id)
  if (activeTab.value === id) activeTab.value = 'profile'
}

function moveSection(index, delta) {
  const target = index + delta
  if (target < 0 || target >= draft.value.sections.length) return
  const list = draft.value.sections
  ;[list[index], list[target]] = [list[target], list[index]]
}

function toggleVisible(section) {
  section.visible = !section.visible
}

function exportJson() {
  const blob = new Blob([JSON.stringify(draft.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'portfolio-content.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function onImport(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const text = await file.text()
  const result = await importContent(text)
  if (result.ok) {
    draft.value = clone(state.content)
    flash('Content imported.')
  } else {
    flash(result.error)
  }
  event.target.value = ''
}

function guard(e) {
  if (!dirty.value) return
  e.preventDefault()
  e.returnValue = ''
}

onMounted(() => window.addEventListener('beforeunload', guard))
onBeforeUnmount(() => window.removeEventListener('beforeunload', guard))
</script>

<template>
  <AdminLogin v-if="!signedIn" />

  <div v-else class="min-h-screen bg-ink-100">
    <header class="sticky top-0 z-40 border-b border-ink-200 bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex w-full max-w-[90rem] flex-wrap items-center gap-3 px-5 py-3">
        <div class="flex items-center gap-3">
          <span
            class="grid h-9 w-9 place-items-center rounded-xl text-white"
            style="background-image: linear-gradient(135deg, var(--accent), #0f172a)"
          >
            <AppIcon name="edit" :size="17" />
          </span>
          <div>
            <p class="text-sm font-bold text-ink-900">Content studio</p>
            <p class="text-[11px] text-ink-500">
              {{ isFirebaseConfigured ? 'Firebase Firestore · live' : 'Local browser storage' }}
              <span v-if="dirty" class="ml-1 font-semibold text-amber-600">· unsaved changes</span>
            </p>
          </div>
        </div>

        <div class="ml-auto flex flex-wrap items-center gap-2">
          <RouterLink to="/" target="_blank" class="btn-ghost btn-sm">
            <AppIcon name="eye" :size="14" />
            View site
          </RouterLink>
          <button type="button" class="btn-ghost btn-sm" @click="exportJson">
            <AppIcon name="download" :size="14" />
            Export
          </button>
          <button type="button" class="btn-ghost btn-sm" @click="importInput.click()">
            <AppIcon name="upload" :size="14" />
            Import
          </button>
          <input ref="importInput" type="file" accept="application/json" class="hidden" @change="onImport" />
          <button type="button" class="btn-ghost btn-sm" :disabled="!dirty" @click="discard">
            <AppIcon name="refresh" :size="14" />
            Discard
          </button>
          <button type="button" class="btn-primary btn-sm" :disabled="!dirty || state.saving" @click="save">
            <AppIcon name="save" :size="14" />
            {{ state.saving ? 'Publishing…' : 'Save & publish' }}
          </button>
          <button type="button" class="admin-mini" title="Sign out" @click="logout">
            <AppIcon name="logout" :size="15" />
          </button>
        </div>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-[90rem] gap-6 px-5 py-6 lg:grid-cols-[19rem,1fr]">
      <aside class="h-fit lg:sticky lg:top-24">
        <div class="card overflow-hidden">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition"
            :class="activeTab === 'profile' ? 'bg-accent-50 accent-text' : 'text-ink-700 hover:bg-ink-50'"
            @click="activeTab = 'profile'"
          >
            <AppIcon name="users" :size="16" />
            Profile, theme & hero
          </button>

          <div class="border-t border-ink-100 px-4 py-3">
            <p class="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-400">Sections</p>

            <ul class="grid gap-1">
              <li
                v-for="(section, index) in draft.sections"
                :key="section.id"
                class="group flex items-center gap-1 rounded-lg pr-1 transition"
                :class="activeTab === section.id ? 'bg-accent-50' : 'hover:bg-ink-50'"
              >
                <button
                  type="button"
                  class="min-w-0 flex-1 px-2 py-2 text-left"
                  @click="activeTab = section.id"
                >
                  <span class="block truncate text-sm font-medium" :class="activeTab === section.id ? 'accent-text' : 'text-ink-700'">
                    {{ section.title }}
                  </span>
                  <span class="block truncate text-[11px] text-ink-400">
                    {{ section.type }} · {{ section.items.length }} item(s)
                  </span>
                </button>

                <button type="button" class="admin-mini h-7 w-7" title="Move up" @click="moveSection(index, -1)">
                  <AppIcon name="up" :size="12" />
                </button>
                <button type="button" class="admin-mini h-7 w-7" title="Move down" @click="moveSection(index, 1)">
                  <AppIcon name="down" :size="12" />
                </button>
                <button
                  type="button"
                  class="admin-mini h-7 w-7"
                  :title="section.visible ? 'Hide section' : 'Show section'"
                  @click="toggleVisible(section)"
                >
                  <AppIcon :name="section.visible ? 'eye' : 'close'" :size="12" />
                </button>
                <button type="button" class="admin-mini admin-mini-danger h-7 w-7" title="Delete section" @click="removeSection(section.id)">
                  <AppIcon name="trash" :size="12" />
                </button>
              </li>
            </ul>

            <div v-if="showAdd" class="mt-3 grid gap-2 rounded-xl border border-ink-200 bg-ink-50 p-3">
              <label class="label mb-0">Layout</label>
              <select v-model="newType" class="field">
                <option v-for="t in SECTION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
              <p class="text-[11px] text-ink-500">{{ SECTION_TYPES.find((t) => t.value === newType)?.hint }}</p>
              <div class="flex gap-2">
                <button type="button" class="btn-primary btn-sm flex-1" @click="addSection">Create</button>
                <button type="button" class="btn-ghost btn-sm" @click="showAdd = false">Cancel</button>
              </div>
            </div>

            <button v-else type="button" class="btn-ghost btn-sm mt-3 w-full" @click="showAdd = true">
              <AppIcon name="plus" :size="14" />
              New section
            </button>
          </div>

          <div class="border-t border-ink-100 px-4 py-3">
            <button type="button" class="btn-danger btn-sm w-full" @click="factoryReset">
              <AppIcon name="refresh" :size="14" />
              Reset to résumé defaults
            </button>
          </div>
        </div>
      </aside>

      <main>
        <ProfileEditor
          v-if="activeTab === 'profile'"
          :profile="draft.profile"
          :theme="draft.theme"
          @update="draft.profile = $event"
          @update-theme="draft.theme = $event"
        />
        <SectionEditor v-else-if="activeSection" :section="activeSection" @update="updateSection" />
        <p v-else class="card p-8 text-center text-sm text-ink-500">Pick something on the left to start editing.</p>
      </main>
    </div>

    <Transition name="toast">
      <p
        v-if="toast"
        class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-medium text-white shadow-lift"
        role="status"
      >
        {{ toast }}
      </p>
    </Transition>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
