// Verificación de sesión y permiso de gestión para rutas API (evita duplicar bloques).

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'
import { getUserProfileForSidebar } from '@/services/user.service'

const UNAUTHORIZED = 'No autorizado'
const FORBIDDEN = 'Prohibido'

export type SesionOk = { uid: string; email?: string }

export async function assertSesionValida(): Promise<
  NextResponse | SesionOk
> {
  const store = await cookies()
  const cookie = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!cookie) {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    const uid = decoded.uid
    const email = typeof decoded.email === 'string' ? decoded.email : undefined
    return { uid, email }
  } catch {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }
}

export async function assertPuedeGestionar(
  sesion: SesionOk,
): Promise<NextResponse | null> {
  const perfil = await getUserProfileForSidebar(sesion.uid, sesion.email)
  if (!canManageUsers(perfil?.role)) {
    return NextResponse.json({ error: FORBIDDEN }, { status: 403 })
  }
  return null
}
