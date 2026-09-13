// Firebase bootstrap.
//
// Values come from Vite env vars (see .env.example). When they are absent the
// app transparently falls back to a localStorage-backed store so it can be run
// and demoed without a Firebase project.
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId)

let db = null
let auth = null

if (isFirebaseConfigured) {
  const app = initializeApp(config)
  db = getFirestore(app)
  auth = getAuth(app)
}

export { db, auth }

export const CONTENT_COLLECTION = 'portfolio'
export const CONTENT_DOC = 'content'
