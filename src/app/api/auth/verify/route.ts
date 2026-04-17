// GET: whether the session cookie exists and is valid (for the client hook).

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'

const UNAUTHORIZED = 'No autorizado'

export async function GET() {
  try {
    const store = await cookies()
    const value = store.get(NOMBRE_COOKIE_SESION)?.value
    if (!value) {
      return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
    }
    const auth = getAdminAuth()
    await auth.verifySessionCookie(value, true)
    return NextResponse.json({ exito: true })
  } catch (error) {
    console.error('GET /api/auth/verify', error)
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }
}
