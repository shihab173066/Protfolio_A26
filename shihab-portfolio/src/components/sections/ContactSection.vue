<script setup>
import { computed, ref } from 'vue'
import AppIcon from '../AppIcon.vue'
import { useResume } from '../../composables/useResume'

const props = defineProps({
  section: { type: Object, required: true },
  profile: { type: Object, required: true },
})

const { generating, error: resumeError, downloadResume } = useResume()

const form = ref({ name: '', email: '', message: '' })

const mailto = computed(() => {
  const subject = encodeURIComponent(`Portfolio enquiry from ${form.value.name || 'a visitor'}`)
  const body = encodeURIComponent(`${form.value.message}\n\n— ${form.value.name}\n${form.value.email}`)
  return `mailto:${props.profile.email}?subject=${subject}&body=${body}`
})

const details = computed(() =>
  [
    { icon: 'mail', label: 'Email', value: props.profile.email, href: `mailto:${props.profile.email}` },
    { icon: 'phone', label: 'Phone', value: props.profile.phone, href: `tel:${props.profile.phone}` },
    { icon: 'pin', label: 'Location', value: props.profile.location, href: '' },
  ].filter((d) => d.value),
)
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[0.95fr,1.05fr]">
    <div v-reveal class="grid gap-4">
      <p v-if="section.body" class="prose-body">{{ section.body }}</p>

      <ul class="grid gap-3">
        <li v-for="d in details" :key="d.label" class="card flex items-center gap-4 p-4">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-50 accent-text">
            <AppIcon :name="d.icon" :size="18" />
          </span>
          <div class="min-w-0">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{{ d.label }}</p>
            <a v-if="d.href" :href="d.href" class="break-all text-sm font-semibold text-ink-900 hover:underline">
              {{ d.value }}
            </a>
            <p v-else class="text-sm font-semibold text-ink-900">{{ d.value }}</p>
          </div>
        </li>
      </ul>

      <button type="button" class="btn-primary w-full sm:w-auto" style="height: 50px; display: flex; align-items: center; justify-content: center;" :disabled="generating" @click="downloadResume">
        <AppIcon name="download" :size="17" />
        {{ generating ? 'Building PDF…' : 'Download resume (PDF)' }}
      </button>
      <p v-if="resumeError" role="alert" class="text-sm text-rose-600">{{ resumeError }}</p>
    </div>

    <!-- <form v-reveal="100" class="card p-6 sm:p-8" @submit.prevent>
      <h3 class="text-lg font-bold text-ink-900">Send a message</h3>
      <p class="mt-1 text-sm text-ink-500">Fill this in and your mail client opens with it ready to send.</p>

      <div class="mt-6 grid gap-4">
        <div>
          <label class="label" for="c-name">Your name</label>
          <input id="c-name" v-model="form.name" class="field" type="text" placeholder="Jane Doe" autocomplete="name" />
        </div>
        <div>
          <label class="label" for="c-email">Your email</label>
          <input
            id="c-email"
            v-model="form.email"
            class="field"
            type="email"
            placeholder="jane@company.com"
            autocomplete="email"
          />
        </div>
        <div>
          <label class="label" for="c-msg">Message</label>
          <textarea id="c-msg" v-model="form.message" class="field min-h-[9rem]" placeholder="Tell me about the role or project…" />
        </div>
        <a
          :href="mailto"
          class="btn-primary"
          :class="!form.message ? 'pointer-events-none opacity-60' : ''"
          :aria-disabled="!form.message"
        >
          <AppIcon name="mail" :size="17" />
          Compose email
        </a>
      </div>
    </form> -->
    <div v-reveal="100" class="card overflow-hidden w-full min-h-[400px] sm:min-h-[500px]">
      <iframe
        title="Map of Dhaka, Bangladesh"
        width="100%"
        height="100%"
        style="border:0; min-height: 400px;"
        loading="lazy"
        allowfullscreen
        referrerpolicy="no-referrer-when-downgrade"
        src="https://maps.google.com/maps?q=Dhaka,Bangladesh&t=&z=12&ie=UTF8&iwloc=&output=embed">
      </iframe>
    </div>
  </div>
</template>
