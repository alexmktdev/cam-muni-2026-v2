// POST: crear usuario en Auth + Firestore (rol admin fijo). Sesión + permiso de gestión.

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'
import { invalidarCacheUsersList } from '@/lib/cache/usersListCatalog'
import { crearUsuarioDesdePanel, getUserProfileForSidebar } from '@/services/user.service'

const postBodySchema = z
  .object({
    nombre: z.string().trim().min(1).max(100),
    apellido: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    password: z.string().min(6).max(128),
    confirmPassword: z.string().min(1).max(128),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'coincidencia',
    path: ['confirmPassword'],
  })

const UNAUTHORIZED = 'No autorizado'
const FORBIDDEN = 'Prohibido'

export async function POST(request: Request) {
  const store = await cookies()
  const cookie = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!cookie) {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }

  let requesterUid: string
  let requesterEmail: string | undefined
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    requesterUid = decoded.uid
    requesterEmail = typeof decoded.email === 'string' ? decoded.email : undefined
  } catch {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }

  const perfilRequester = await getUserProfileForSidebar(requesterUid, requesterEmail)
  if (!canManageUsers(perfilRequester?.role)) {
    return NextResponse.json({ error: FORBIDDEN }, { status: 403 })
  }

  const json = (await request.json().catch(() => null)) as unknown
  const parsed = postBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const { nombre, apellido, email, password } = parsed.data
  const resultado = await crearUsuarioDesdePanel({ nombre, apellido, email, password })

  if (resultado.ok) {
    invalidarCacheUsersList()
    return NextResponse.json({ exito: true }, { status: 201 })
  }
  if (resultado.codigo === 'email_existe') {
    return NextResponse.json({ error: 'Ese correo ya está registrado' }, { status: 409 })
  }
  if (resultado.codigo === 'datos_invalidos') {
    return NextResponse.json({ error: 'Datos de cuenta no válidos' }, { status: 400 })
  }
  return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 })
}
