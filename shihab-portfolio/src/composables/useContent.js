import { reactive, readonly, ref } from 'vue'
import { CONTENT_COLLECTION, CONTENT_DOC, getFirebase, isFirebaseConfigured } from '../firebase'
import { cloneDefaults, emptyItem, uid } from '../data/defaultContent'

const LOCAL_KEY = 'shihab-portfolio:content'

const state = reactive({
  content: cloneDefaults(),
  loading: true,
  saving: false,
  error: '',
  source: isFirebaseConfigured ? 'firestore' : 'local',
  lastSavedAt: null,
})

let started = false
const ready = ref(false)

/** Fills in anything a stored document is missing so the UI never breaks. */
function normalize(raw) {
  const base = cloneDefaults()
  if (!raw || typeof raw !== 'object') return base

  const profile = { ...base.profile, ...(raw.profile || {}) }
  profile.roles = Array.isArray(profile.roles) ? profile.roles : []
  profile.stats = (Array.isArray(profile.stats) ? profile.stats : []).map((s) => ({
    id: s.id || uid('stat'),
    value: s.value || '',
    label: s.label || '',
  }))
  profile.socials = (Array.isArray(profile.socials) ? profile.socials : []).map((s) => ({
    id: s.id || uid('social'),
    label: s.label || '',
    icon: s.icon || 'link',
    url: s.url || '',
  }))

  const sections = (Array.isArray(raw.sections) ? raw.sections : base.sections).map((section) => ({
    id: section.id || uid('section'),
    type: section.type || 'cards',
    title: section.title || 'Untitled section',
    subtitle: section.subtitle || '',
    body: section.body || '',
    visible: section.visible !== false,
    inNav: section.inNav !== false,
    items: (Array.isArray(section.items) ? section.items : []).map((item) => ({
      ...emptyItem(),
      ...item,
      id: item.id || uid('item'),
      bullets: Array.isArray(item.bullets) ? item.bullets : [],
      tags: Array.isArray(item.tags) ? item.tags : [],
      links: (Array.isArray(item.links) ? item.links : []).map((l) => ({
        id: l.id || uid('link'),
        label: l.label || '',
        url: l.url || '',
      })),
    })),
  }))

  return {
    version: raw.version || base.version,
    theme: { ...base.theme, ...(raw.theme || {}) },
    profile,
    sections,
  }
}

function applyTheme(content) {
  const accent = content?.theme?.accent
  if (accent) document.documentElement.style.setProperty('--accent', accent)
}

function readLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(content) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(content))
  } catch {
    /* storage full or blocked — non fatal */
  }
}

function setContent(next) {
  state.content = normalize(next)
  applyTheme(state.content)
}

/**
 * Firestore's error codes name the mechanism, not the fix. `permission-denied`
 * in particular is almost always the rules file, and saying so saves an hour of
 * staring at the network tab.
 */
function describeFirestoreError(err) {
  switch (err?.code) {
    case 'permission-denied':
      return 'Firestore rejected the write. Check that firestore.rules is deployed and that the signed-in account matches the admin address in it.'
    case 'unauthenticated':
      return 'Your admin session expired. Sign out and back in.'
    case 'unavailable':
      return 'Could not reach Firestore. Check your connection and try again.'
    case 'not-found':
      return 'The Firestore database does not exist yet. Create it in Firebase console → Firestore Database.'
    case 'invalid-argument':
      return 'Firestore rejected the document — it may be over the 1 MB limit. Large embedded images are the usual cause.'
    default:
      return err?.message || 'Could not save changes.'
  }
}

/**
 * Starts the live content stream. With Firebase configured this is a Firestore
 * `onSnapshot` listener, so an admin save is pushed to every open visitor tab.
 */
export async function initContent() {
  if (started) return
  started = true

  // Paint the cached copy immediately, then let Firestore correct it.
  setContent(readLocal())
  state.loading = false
  ready.value = true

  const fb = await getFirebase()
  if (!fb) return

  const { doc, onSnapshot } = fb.firestore
  onSnapshot(
    doc(fb.db, CONTENT_COLLECTION, CONTENT_DOC),
    (snap) => {
      if (snap.exists()) {
        setContent(snap.data())
        writeLocal(state.content)
      }
      state.error = ''
    },
    (err) => {
      // Keep showing the cached copy so visitors still see something.
      console.error('[portfolio] Firestore subscription failed:', err)
      state.error =
        err?.code === 'permission-denied'
          ? 'Firestore denied public read access — deploy firestore.rules. Showing the last cached version.'
          : 'Live content unavailable — showing the last cached version.'
      state.source = 'local'
    },
  )
}

export async function saveContent(next) {
  const payload = normalize(next)
  state.saving = true
  state.error = ''
  try {
    const fb = await getFirebase()
    if (fb) {
      const { doc, setDoc } = fb.firestore
      await setDoc(doc(fb.db, CONTENT_COLLECTION, CONTENT_DOC), payload)
    }
    writeLocal(payload)
    // With Firestore the snapshot listener also pushes this, but setting it
    // straight away keeps the admin preview instant.
    setContent(payload)
    state.lastSavedAt = new Date()
    return { ok: true }
  } catch (err) {
    console.error('[portfolio] save failed:', err)
    state.error = describeFirestoreError(err)
    return { ok: false, error: state.error }
  } finally {
    state.saving = false
  }
}

export async function resetContent() {
  return saveContent(cloneDefaults())
}

export async function importContent(json) {
  try {
    return await saveContent(JSON.parse(json))
  } catch {
    state.error = 'That is not valid JSON.'
    return { ok: false, error: state.error }
  }
}

export function useContent() {
  return { state: readonly(state), ready }
}
