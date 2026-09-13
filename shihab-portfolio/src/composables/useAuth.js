import { computed, ref } from 'vue'
import { getFirebase, isFirebaseConfigured } from '../firebase'

// SECURITY NOTE
// -------------
// The id/password below is a *development* convenience only. Anything checked
// in the browser can be read by anyone, so it is not real access control.
// The real protection for your data is Firestore security rules:
//
//   match /portfolio/{doc} {
//     allow read: if true;
//     allow write: if request.auth != null && request.auth.uid == 'YOUR_UID';
//   }
//
// Set VITE_ADMIN_EMAIL (and create that user in Firebase Authentication) to
// switch this screen to a real Firebase Auth sign-in.

const DEV_ID = import.meta.env.VITE_ADMIN_ID || 'admin'
const DEV_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'password1234'
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

const SESSION_KEY = 'shihab-portfolio:admin-session'

const signedIn = ref(sessionStorage.getItem(SESSION_KEY) === '1')
const authError = ref('')
const busy = ref(false)

export const usesFirebaseAuth = computed(() => Boolean(isFirebaseConfigured && ADMIN_EMAIL))

export function useAuth() {
  async function login(id, password) {
    busy.value = true
    authError.value = ''
    try {
      if (usesFirebaseAuth.value) {
        const fb = await getFirebase()
        await fb.authSdk.signInWithEmailAndPassword(fb.auth, ADMIN_EMAIL, password)
      } else if (id !== DEV_ID || password !== DEV_PASSWORD) {
        throw new Error('Invalid credentials.')
      }
      signedIn.value = true
      sessionStorage.setItem(SESSION_KEY, '1')
      return true
    } catch (err) {
      authError.value =
        err?.code === 'auth/invalid-credential' ? 'Invalid credentials.' : err?.message || 'Sign in failed.'
      return false
    } finally {
      busy.value = false
    }
  }

  async function logout() {
    if (usesFirebaseAuth.value) {
      const fb = await getFirebase()
      await fb.authSdk.signOut(fb.auth).catch(() => {})
    }
    signedIn.value = false
    sessionStorage.removeItem(SESSION_KEY)
  }

  return { signedIn, authError, busy, login, logout, usesFirebaseAuth }
}
