// Firebase bootstrap.
//
// Values come from Vite env vars (see .env.example). When they are absent the
// app transparently falls back to a localStorage-backed store so it can be run
// and demoed without a Firebase project.
//
// The SDK is imported dynamically so visitors who only read the portfolio never
// pay for it in the initial bundle.

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId)

export const CONTENT_COLLECTION = 'portfolio'
export const CONTENT_DOC = 'content'

let pending = null

/** Resolves to `{ db, firestore, auth, authSdk }`, or `null` when unconfigured. */
export function getFirebase() {
  if (!isFirebaseConfigured) return Promise.resolve(null)
  if (pending) return pending

  pending = (async () => {
    const [{ initializeApp }, firestore, authSdk] = await Promise.all([
      import('firebase/app'),
      import('firebase/firestore'),
      import('firebase/auth'),
    ])
    const app = initializeApp(config)
    return {
      app,
      firestore,
      authSdk,
      db: firestore.getFirestore(app),
      auth: authSdk.getAuth(app),
    }
  })()

  return pending
}
