// PATCH: actualizar club. DELETE: eliminar club (sesión + permiso de gestión).

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'
import { invalidarCacheClubesCatalogo } from '@/lib/cache/clubesCatalogo'
import { invalidarCachesTrasMutacionMiembrosClub } from '@/lib/cache/trasMutacionMiembrosClub'
import {
  actualizarClubEnFirestore,
  eliminarClubEnFirestore,
  obtenerClubClientePorId,
} from '@/services/club.service'
import { getUserProfileForSidebar } from '@/services/user.service'

const UNAUTHORIZED = 'No autorizado'
const FORBIDDEN = 'Prohibido'

const idParamSchema = z.string().trim().min(1).max(128)

const patchBodySchema = z.object({
  nombre: z.string().trim().min(1).max(196),
  comuna: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  activo: z.boolean(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const store = await cookies()
  const cookie = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!cookie) {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }

  let uid: string
  let email: string | undefined
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    uid = decoded.uid
    email = typeof decoded.email === 'string' ? decoded.email : undefined
  } catch {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }

  const perfilRequester = await getUserProfileForSidebar(uid, email)
  if (!canManageUsers(perfilRequester?.role)) {
    return NextResponse.json({ error: FORBIDDEN }, { status: 403 })
  }

  const { id: rawId } = await context.params
  const idParsed = idParamSchema.safeParse(rawId)
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const json = (await request.json().catch(() => null)) as unknown
  const bodyParsed = patchBodySchema.safeParse(json)
  if (!bodyParsed.success) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const resultado = await actualizarClubEnFirestore(idParsed.data, bodyParsed.data)
  if (!resultado.ok) {
    if (resultado.razon === 'not_found') {
      return NextResponse.json({ error: 'Club no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ error: 'No se pudo actualizar el club' }, { status: 500 })
  }

  const club = await obtenerClubClientePorId(idParsed.data)
  if (!club) {
    return NextResponse.json({ error: 'No se pudo cargar el club actualizado' }, { status: 500 })
  }

  invalidarCacheClubesCatalogo()
  return NextResponse.json({ club })
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const store = await cookies()
  const cookie = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!cookie) {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }

  let uid: string
  let email: string | undefined
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    uid = decoded.uid
    email = typeof decoded.email === 'string' ? decoded.email : undefined
  } catch {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }

  const perfilRequester = await getUserProfileForSidebar(uid, email)
  if (!canManageUsers(perfilRequester?.role)) {
    return NextResponse.json({ error: FORBIDDEN }, { status: 403 })
  }

  const { id: rawId } = await context.params
  const idParsed = idParamSchema.safeParse(rawId)
  if (!idParsed.success) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const ok = await eliminarClubEnFirestore(idParsed.data)
  if (!ok) {
    return NextResponse.json({ error: 'No se pudo eliminar el club' }, { status: 500 })
  }

  invalidarCacheClubesCatalogo()
  invalidarCachesTrasMutacionMiembrosClub()
  return NextResponse.json({ exito: true })
}
