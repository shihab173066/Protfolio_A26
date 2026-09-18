import { computed, ref } from 'vue'

// WHAT THIS IS, AND WHAT IT IS NOT
// --------------------------------
// This site is static files on GitHub Pages. There is no server, so there is no
// place to check a password that the visitor does not control. Anyone can read
// the bundle or set the session flag from devtools and reach the admin UI. That
// is a property of static hosting, not something this file can fix.
//
// What it *does* guarantee:
//   1. The plaintext password exists nowhere — not in git, not in dist/. Only a
//      PBKDF2-SHA256 hash (310k iterations) ships, so the password itself stays
//      private even to someone reading the built JS.
//   2. No hardcoded fallback credential. Missing config = nobody signs in.
//
// This is acceptable here because the admin panel writes to localStorage only
// (see useContent.js — the Firestore path is dormant without config). Someone
// who bypasses this gate edits their own browser's copy of the site and nothing
// else. There is no shared state to protect.
//
// If content ever becomes server-persisted, this must be replaced with real
// server-side auth. A hash in the client is not an access control.

const ADMIN_ID = import.meta.env.VITE_ADMIN_ID || ''
const PW_SALT = import.meta.env.VITE_ADMIN_PW_SALT || ''
const PW_HASH = import.meta.env.VITE_ADMIN_PW_HASH || ''
const PW_ITERATIONS = Number(import.meta.env.VITE_ADMIN_PW_ITERATIONS) || 310000

const SESSION_KEY = 'shihab-portfolio:admin-session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000

/** True once the hash keys are present; `npm run set-admin-password` writes them. */
export const credentialsConfigured = computed(() =>
  Boolean(ADMIN_ID && PW_SALT && PW_HASH),
)

function readSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return false
    const { exp } = JSON.parse(raw)
    if (typeof exp !== 'number' || Date.now() >= exp) {
      sessionStorage.removeItem(SESSION_KEY)
      return false
    }
    return true
  } catch {
    // Malformed JSON, or storage blocked entirely (private mode / disabled).
    return false
  }
}

function writeSession() {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }))
  } catch {
    // Non-fatal: the in-memory ref still holds for this page view.
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* ignore */
  }
}

const signedIn = ref(readSession())
const authError = ref('')
const busy = ref(false)

let failedAttempts = 0
let lockedUntil = 0

const base64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

/**
 * PBKDF2-SHA256, 32-byte output. Must stay byte-identical to the Node
 * derivation in scripts/set-admin-password.mjs.
 */
async function derive(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return new Uint8Array(bits)
}

/** Compares every byte regardless of where the first mismatch is. */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i]
  return diff === 0
}

export function useAuth() {
  async function login(id, password) {
    authError.value = ''

    if (!credentialsConfigured.value) {
      authError.value = 'Admin credentials are not configured on this build.'
      return false
    }

    const remaining = lockedUntil - Date.now()
    if (remaining > 0) {
      authError.value = `Too many attempts. Try again in ${Math.ceil(remaining / 1000)}s.`
      return false
    }

    busy.value = true
    try {
      const derived = await derive(password, base64ToBytes(PW_SALT), PW_ITERATIONS)
      // Check both factors before branching so a wrong id and a wrong password
      // cost the same amount of work.
      const idOk = id === ADMIN_ID
      const pwOk = timingSafeEqual(derived, base64ToBytes(PW_HASH))

      if (!idOk || !pwOk) {
        failedAttempts += 1
        if (failedAttempts >= MAX_ATTEMPTS) {
          lockedUntil = Date.now() + LOCKOUT_MS
          failedAttempts = 0
          authError.value = 'Too many attempts. Locked for 60 seconds.'
        } else {
          authError.value = 'Invalid credentials.'
        }
        return false
      }

      failedAttempts = 0
      signedIn.value = true
      writeSession()
      return true
    } catch (err) {
      // crypto.subtle is undefined outside a secure context (plain http on a
      // non-localhost host) — worth naming, since the cause is not obvious.
      authError.value = crypto?.subtle
        ? err?.message || 'Sign in failed.'
        : 'Secure context required — open the site over https or on localhost.'
      return false
    } finally {
      busy.value = false
    }
  }

  function logout() {
    signedIn.value = false
    authError.value = ''
    clearSession()
  }

  return { signedIn, authError, busy, login, logout, credentialsConfigured }
}
