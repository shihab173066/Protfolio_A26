<script setup>
import { ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import StringListEditor from './StringListEditor.vue'
import { uid } from '../../data/defaultContent'

const props = defineProps({
  profile: { type: Object, required: true },
  theme: { type: Object, required: true },
})

const emit = defineEmits(['update', 'update-theme'])

const photoNote = ref('')

const patch = (key, value) => emit('update', { ...props.profile, [key]: value })

function patchStat(index, key, value) {
  patch('stats', props.profile.stats.map((s, i) => (i === index ? { ...s, [key]: value } : s)))
}

function patchSocial(index, key, value) {
  patch('socials', props.profile.socials.map((s, i) => (i === index ? { ...s, [key]: value } : s)))
}

const ICONS = ['link', 'code', 'users', 'doc', 'cap', 'spark', 'briefcase', 'mail']

const UPLOAD_ENDPOINT = '/__upload-public'

function embedAsDataUrl(file) {
  const reader = new FileReader()
  reader.onload = () => {
    patch('photoUrl', reader.result)
    photoNote.value = 'Saved inside the content document (base64).'
  }
  reader.readAsDataURL(file)
}

async function onPhotoFile(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  if (!file.type.startsWith('image/')) {
    photoNote.value = 'Please choose an image file.'
    return
  }

  photoNote.value = 'Uploading…'

  // The dev server writes the file into `public/uploads/`; a static build has no
  // such endpoint, so fall back to embedding small images in the document.
  //
  // The cutoff is deliberately low: base64 inflates a file by ~33% and the whole
  // content document has to fit inside Firestore's 1 MB limit alongside every
  // section. Anything bigger belongs in public/ and gets committed with git.
  try {
    const res = await fetch(`${UPLOAD_ENDPOINT}?name=${encodeURIComponent(file.name)}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed.')
    patch('photoUrl', data.url)
    photoNote.value = `Saved to public/uploads — referenced as ${data.url}`
    return
  } catch {
    if (file.size > 150 * 1024) {
      photoNote.value =
        'Too large to embed. Put the file in shihab-portfolio/public/, commit and push it, then set this field to a path like ./my-photo.jpg.'
      return
    }
    embedAsDataUrl(file)
  }
}
</script>

<template>
  <div class="grid gap-6">
    <div class="card p-5 sm:p-6">
      <h3 class="mb-4 text-sm font-bold text-ink-900">Identity</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Full name</label>
          <input class="field" type="text" :value="profile.name" @input="patch('name', $event.target.value)" />
        </div>
        <div>
          <label class="label">Primary role</label>
          <input class="field" type="text" :value="profile.role" @input="patch('role', $event.target.value)" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Tagline (hero paragraph)</label>
          <textarea class="field min-h-[5rem]" :value="profile.tagline" @input="patch('tagline', $event.target.value)" />
        </div>
        <div class="sm:col-span-2">
          <label class="label">Résumé summary</label>
          <textarea class="field min-h-[6rem]" :value="profile.summary" @input="patch('summary', $event.target.value)" />
        </div>
        <div class="sm:col-span-2">
          <StringListEditor
            :model-value="profile.roles"
            label="Rotating hero titles"
            placeholder="Full-Stack Web Developer"
            @update:model-value="patch('roles', $event)"
          />
        </div>
        <div>
          <label class="label">Availability badge</label>
          <input class="field" type="text" :value="profile.availability" @input="patch('availability', $event.target.value)" />
        </div>
        <div>
          <label class="label">Accent colour</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              class="h-11 w-14 cursor-pointer rounded-xl border border-ink-300 bg-white p-1"
              :value="theme.accent"
              @input="emit('update-theme', { ...theme, accent: $event.target.value })"
            />
            <input
              class="field font-mono text-xs"
              type="text"
              :value="theme.accent"
              @input="emit('update-theme', { ...theme, accent: $event.target.value })"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="card p-5 sm:p-6">
      <h3 class="mb-4 text-sm font-bold text-ink-900">Contact & files</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Email</label>
          <input class="field" type="email" :value="profile.email" @input="patch('email', $event.target.value)" />
        </div>
        <div>
          <label class="label">Phone</label>
          <input class="field" type="tel" :value="profile.phone" @input="patch('phone', $event.target.value)" />
        </div>
        <div>
          <label class="label">Location</label>
          <input class="field" type="text" :value="profile.location" @input="patch('location', $event.target.value)" />
        </div>
        <div>
          <label class="label">Résumé override URL (optional)</label>
          <input class="field" type="text" :value="profile.resumeUrl" placeholder="Leave empty to auto-generate" @input="patch('resumeUrl', $event.target.value)" />
          <p class="mt-1 text-[11px] text-ink-400">
            Leave empty: the résumé PDF is generated from this content on click. Set a full
            <code>https://</code> link to point the buttons at a hosted file instead.
          </p>
        </div>
        <div class="sm:col-span-2">
          <label class="label">Photo path or URL</label>
          <div class="flex flex-wrap items-center gap-3">
            <img
              v-if="profile.photoUrl"
              :src="profile.photoUrl"
              alt=""
              class="h-14 w-14 rounded-xl border border-ink-200 object-cover"
            />
            <input class="field flex-1" type="text" :value="profile.photoUrl" @input="patch('photoUrl', $event.target.value)" />
            <label class="btn-ghost btn-sm cursor-pointer">
              <AppIcon name="upload" :size="14" />
              Upload
              <input type="file" accept="image/*" class="hidden" @change="onPhotoFile" />
            </label>
          </div>
          <p v-if="photoNote" class="mt-1 text-[11px] text-ink-500">{{ photoNote }}</p>
        </div>
      </div>
    </div>

    <div class="card p-5 sm:p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-sm font-bold text-ink-900">Hero statistics</h3>
        <button
          type="button"
          class="btn-ghost btn-sm"
          @click="patch('stats', [...profile.stats, { id: uid('stat'), value: '', label: '' }])"
        >
          <AppIcon name="plus" :size="14" />
          Add stat
        </button>
      </div>

      <div class="grid gap-2">
        <div v-for="(stat, index) in profile.stats" :key="stat.id" class="flex items-center gap-1.5">
          <input
            class="field sm:max-w-[7rem]"
            type="text"
            placeholder="4+"
            :value="stat.value"
            @input="patchStat(index, 'value', $event.target.value)"
          />
          <input
            class="field"
            type="text"
            placeholder="Years in software"
            :value="stat.label"
            @input="patchStat(index, 'label', $event.target.value)"
          />
          <button
            type="button"
            class="admin-mini admin-mini-danger shrink-0"
            title="Remove"
            @click="patch('stats', profile.stats.filter((_, i) => i !== index))"
          >
            <AppIcon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div class="card p-5 sm:p-6">
      <div class="mb-4 flex items-center justify-between">
        <h3 class="text-sm font-bold text-ink-900">Social links</h3>
        <button
          type="button"
          class="btn-ghost btn-sm"
          @click="patch('socials', [...profile.socials, { id: uid('social'), label: '', icon: 'link', url: '' }])"
        >
          <AppIcon name="plus" :size="14" />
          Add link
        </button>
      </div>

      <div class="grid gap-2">
        <div v-for="(social, index) in profile.socials" :key="social.id" class="flex flex-wrap items-center gap-1.5">
          <input
            class="field sm:max-w-[9rem]"
            type="text"
            placeholder="GitHub"
            :value="social.label"
            @input="patchSocial(index, 'label', $event.target.value)"
          />
          <select class="field sm:max-w-[8rem]" :value="social.icon" @change="patchSocial(index, 'icon', $event.target.value)">
            <option v-for="icon in ICONS" :key="icon" :value="icon">{{ icon }}</option>
          </select>
          <input
            class="field min-w-[12rem] flex-1"
            type="url"
            placeholder="https://…"
            :value="social.url"
            @input="patchSocial(index, 'url', $event.target.value)"
          />
          <button
            type="button"
            class="admin-mini admin-mini-danger shrink-0"
            title="Remove"
            @click="patch('socials', profile.socials.filter((_, i) => i !== index))"
          >
            <AppIcon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
