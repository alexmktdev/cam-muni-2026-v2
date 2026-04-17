import 'server-only'
// Revoca refresh tokens y borra la cookie. Solo en Route Handlers o Server Actions (no en layouts).

import { cookies } from 'next/headers'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'

export async function closeServerSession(): Promise<void> {
  const store = await cookies()
  const value = store.get(NOMBRE_COOKIE_SESION)?.value
  const auth = getAdminAuth()
  if (value) {
    try {
      const decoded = await auth.verifySessionCookie(value, true)
      await auth.revokeRefreshTokens(decoded.uid)
    } catch (error) {
      console.error('closeServerSession: verify or revoke', error)
    }
  }
  const isProd = process.env.NODE_ENV === 'production'
  store.set(NOMBRE_COOKIE_SESION, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}
