// Browser Firebase init for Auth only (never Firestore from here).

import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app'
import {
  getAuth,
  type Auth,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  connectAuthEmulator,
} from 'firebase/auth'
import { getClientFirebaseEnv } from '@/lib/firebase/config'

/** Nombre fijo para no reutilizar por error otra app `[DEFAULT]` tras HMR / recargas. */
const WEB_APP_NAME = 'proyecto-base-web'

let cachedApp: FirebaseApp | null = null

function buildFirebaseOptions(): FirebaseOptions {
  const env = getClientFirebaseEnv()
  const options: FirebaseOptions = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  }
  if (env.NEXT_PUBLIC_FIREBASE_APP_ID) {
    options.appId = env.NEXT_PUBLIC_FIREBASE_APP_ID
  }
  if (env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
    options.messagingSenderId = env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  }
  if (env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    options.storageBucket = env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  }
  return options
}

function getOrCreateClientApp(): FirebaseApp {
  if (cachedApp) {
    return cachedApp
  }
  const existing = getApps().find((a) => a.name === WEB_APP_NAME)
  if (existing) {
    cachedApp = existing
    return cachedApp
  }
  cachedApp = initializeApp(buildFirebaseOptions(), WEB_APP_NAME)
  return cachedApp
}

/** Client Auth: sign-in, sign-out, password reset only. */
export function getClientAuth(): Auth {
  const auth = getAuth(getOrCreateClientApp())
  const env = getClientFirebaseEnv()

  // Evitamos conectar varias veces en el cliente durante recargas de Next.js (HMR)
  const anyAuth = auth as any
  if (env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR && !anyAuth._emulatorConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    anyAuth._emulatorConnected = true
  }

  return auth
}

/** Returns current idToken after email/password sign-in (send to server for session cookie). */
export async function getIdTokenAfterPasswordLogin(
  email: string,
  password: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase()
  const credential = await signInWithEmailAndPassword(
    getClientAuth(),
    normalizedEmail,
    password,
  )
  return credential.user.getIdToken()
}

/** Local sign-out after the server cleared the session cookie. */
export async function signOutClient(): Promise<void> {
  await signOut(getClientAuth())
}

/** Triggers Firebase password reset email. */
export async function sendPasswordResetToEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(getClientAuth(), email)
}
