import 'server-only'
// Reads and verifies the session cookie with Admin SDK (revoked tokens fail).

import { cookies } from 'next/headers'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'

export type VerifiedSession = {
  uid: string
  /** Correo del token de sesión (si viene en el JWT). */
  email?: string
}

import { cache } from 'react'

export const readVerifiedSession = cache(async (): Promise<VerifiedSession | null> => {
  const store = await cookies()
  const value = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!value) {
    return null
  }
  try {
    const auth = getAdminAuth()
    // By passing false, it only checks the JWT signature and expiration crypto locally (<1ms)
    // instead of querying the backend network repeatedly causing 500ms+ lag.
    const decoded = await auth.verifySessionCookie(value, false)
    const email = typeof decoded.email === 'string' ? decoded.email : undefined
    return { uid: decoded.uid, email }
  } catch {
    return null
  }
})
