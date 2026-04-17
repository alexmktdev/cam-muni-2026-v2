import 'server-only'
// Creates the verified httpOnly session cookie from a valid id token (Admin SDK).

import { cookies } from 'next/headers'
import { DURACION_SESION_MS, NOMBRE_COOKIE_SESION, MAX_AGE_COOKIE_SESION_SEG } from '@/constants'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'

export async function createSessionCookieFromIdToken(idToken: string): Promise<void> {
  const auth = getAdminAuth()
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: DURACION_SESION_MS,
  })
  const store = await cookies()
  const isProd = process.env.NODE_ENV === 'production'
  store.set(NOMBRE_COOKIE_SESION, sessionCookie, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_COOKIE_SESION_SEG,
  })
}
