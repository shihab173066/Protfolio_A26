import { computed, ref } from 'vue'
import { getFirebase, isFirebaseConfigured } from '../firebase'

// HOW ADMIN SIGN-IN WORKS
// -----------------------
// Two modes, chosen automatically by whether VITE_FIREBASE_* is configured.
//
//   1. Firebase mode — the real one. `signInWithEmailAndPassword` returns a token
//      that Firestore rules verify on Google's servers, so the gate actually
//      holds: someone who flips a flag in devtools reaches an admin UI whose
//      every write is rejected. This is mandatory once content is shared,
//      because the content lives in one Firestore document every visitor reads.
//
//   2. Local mode — no Firebase config. Falls back to a PBKDF2-SHA256 hash that
//      ships in the bundle. This is NOT access control; it is bypassable from
//      devtools. It is tolerable only because in this mode the admin panel
//      writes to localStorage and nothing else, so bypassing it lets someone
//      edit their own copy of the page. What the hash does guarantee is that the
//      plaintext password appears in neither git nor dist/.
//
// Neither configured means nobody signs in. There is no fallback credential.

const LEGACY_ID = import.meta.env.VITE_ADMIN_ID || ''
const PW_SALT = import.meta.env.VITE_ADMIN_PW_SALT || ''
const PW_HASH = import.meta.env.VITE_ADMIN_PW_HASH || ''
const PW_ITERATIONS = Number(import.meta.env.VITE_ADMIN_PW_ITERATIONS) || 310000

const LEGACY_CONFIGURED = Boolean(LEGACY_ID && PW_SALT && PW_HASH)

/** 'firebase' | 'local' | 'none' — decided once, at module load. */
export const authMode = isFirebaseConfigured ? 'firebase' : LEGACY_CONFIGURED ? 'local' : 'none'

const SESSION_KEY = 'shihab-portfolio:admin-session'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 60 * 1000

/** False only when neither Firebase nor a credential hash reached this build. */
export const credentialsConfigured = computed(() => authMode !== 'none')

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

// In Firebase mode the truth comes from onAuthStateChanged, so start false and
// let the listener correct it. `authReady` keeps the login form from flashing
// on reload while that first callback is still in flight.
const signedIn = ref(authMode === 'local' ? readSession() : false)
const authReady = ref(authMode !== 'firebase')
const adminEmail = ref('')
const authError = ref('')
const busy = ref(false)

let failedAttempts = 0
let lockedUntil = 0

const base64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))

/**
 * PBKDF2-SHA256, 32-byte output. Must stay byte-identical to the Node
 * derivation in scripts/set-admin-password.mjs. Local mode only.
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

/** Firebase error codes are precise but unreadable; say what to actually do. */
function describeAuthError(err) {
  // Firebase appends its prose to this one, so the code is not a fixed string:
  // 'auth/api-key-not-valid.-please-pass-a-valid-api-key.'
  if (err?.code?.startsWith('auth/api-key-not-valid') || err?.code === 'auth/invalid-api-key') {
    return 'The Firebase config in this build is not valid — check VITE_FIREBASE_API_KEY. Copy the real values from Firebase console → Project settings → Your apps → SDK setup and configuration, then restart the dev server.'
  }

  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      // Firebase deliberately collapses these so the form cannot be used to
      // discover which addresses have accounts.
      return 'Invalid email or password.'
    case 'auth/invalid-email':
      return 'That is not a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled in the Firebase console.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Firebase has paused sign-in — wait a few minutes.'
    case 'auth/network-request-failed':
      return 'Could not reach Firebase. Check your connection and try again.'
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is switched off. Enable it in Firebase console → Authentication → Sign-in method.'
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised. Add it in Firebase console → Authentication → Settings → Authorized domains.'
    default:
      return err?.message || 'Sign in failed.'
  }
}

let listenerStarted = false

/**
 * Attaches the Firebase auth listener. Called once from main.js so a deep link
 * to /#/admin resolves the existing session before the view renders. No-op in
 * local mode.
 */
export async function initAuth() {
  if (authMode !== 'firebase' || listenerStarted) return
  listenerStarted = true

  try {
    const fb = await getFirebase()
    if (!fb) {
      authReady.value = true
      return
    }

    const { onAuthStateChanged, setPersistence, browserSessionPersistence } = fb.authSdk

    // Session persistence, not the Firebase default of local: closing the tab
    // ends the admin session, matching the 8h session behaviour this panel had
    // before. Failing to set it is not worth blocking sign-in over.
    await setPersistence(fb.auth, browserSessionPersistence).catch(() => {})

    onAuthStateChanged(
      fb.auth,
      (user) => {
        signedIn.value = Boolean(user)
        adminEmail.value = user?.email || ''
        authReady.value = true
      },
      (err) => {
        console.error('[portfolio] auth listener failed:', err)
        authError.value = describeAuthError(err)
        authReady.value = true
      },
    )
  } catch (err) {
    console.error('[portfolio] Firebase auth failed to initialise:', err)
    authError.value = 'Could not load Firebase authentication.'
    authReady.value = true
  }
}

async function loginWithFirebase(email, password) {
  const fb = await getFirebase()
  if (!fb) {
    authError.value = 'Firebase is not configured on this build.'
    return false
  }

  const { signInWithEmailAndPassword } = fb.authSdk
  const { user } = await signInWithEmailAndPassword(fb.auth, email, password)

  // onAuthStateChanged sets these too, but doing it here makes the redirect
  // immediate rather than one tick late.
  signedIn.value = true
  adminEmail.value = user?.email || ''
  return true
}

async function loginWithHash(id, password) {
  const derived = await derive(password, base64ToBytes(PW_SALT), PW_ITERATIONS)
  // Check both factors before branching so a wrong id and a wrong password cost
  // the same amount of work.
  const idOk = id === LEGACY_ID
  const pwOk = timingSafeEqual(derived, base64ToBytes(PW_HASH))
  if (!idOk || !pwOk) return false

  signedIn.value = true
  adminEmail.value = id
  writeSession()
  return true
}

function registerFailure() {
  failedAttempts += 1
  if (failedAttempts >= MAX_ATTEMPTS) {
    lockedUntil = Date.now() + LOCKOUT_MS
    failedAttempts = 0
    authError.value = 'Too many attempts. Locked for 60 seconds.'
  } else if (!authError.value) {
    authError.value = 'Invalid credentials.'
  }
}

export function useAuth() {
  async function login(id, password) {
    authError.value = ''

    if (authMode === 'none') {
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
      const ok =
        authMode === 'firebase'
          ? await loginWithFirebase(id, password)
          : await loginWithHash(id, password)

      if (!ok) {
        registerFailure()
        return false
      }

      failedAttempts = 0
      return true
    } catch (err) {
      // crypto.subtle is undefined outside a secure context (plain http on a
      // non-localhost host) — worth naming, since the cause is not obvious.
      authError.value =
        authMode === 'local' && !crypto?.subtle
          ? 'Secure context required — open the site over https or on localhost.'
          : describeAuthError(err)
      registerFailure()
      return false
    } finally {
      busy.value = false
    }
  }

  async function logout() {
    if (authMode === 'firebase') {
      try {
        const fb = await getFirebase()
        if (fb) await fb.authSdk.signOut(fb.auth)
      } catch (err) {
        console.error('[portfolio] sign out failed:', err)
      }
    }
    signedIn.value = false
    adminEmail.value = ''
    authError.value = ''
    clearSession()
  }

  return { signedIn, authReady, adminEmail, authError, busy, login, logout, credentialsConfigured, authMode }
}
