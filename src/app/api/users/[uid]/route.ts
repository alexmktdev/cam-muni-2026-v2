// PATCH: perfil en Firestore + Auth (displayName, email). DELETE: Auth + documento users.
// Sesión verificada y canManageUsers; no auto-eliminación ni auto-desactivación.

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { COLECCIONES, NOMBRE_COOKIE_SESION } from '@/constants'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/adminFirebase'
import { invalidarCacheSidebarUsuario } from '@/lib/auth/sidebarProfile'
import { invalidarCacheUsersList } from '@/lib/cache/usersListCatalog'
import { getUserProfileForSidebar } from '@/services/user.service'

const patchBodySchema = z
  .object({
    active: z.boolean().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().toLowerCase().email().max(254).optional(),
    role: z.string().trim().min(1).max(80).optional(),
  })
  .refine(
    (d) =>
      d.active !== undefined ||
      d.name !== undefined ||
      d.lastName !== undefined ||
      d.email !== undefined ||
      d.role !== undefined,
    { message: 'vacío' },
  )

const UNAUTHORIZED = 'No autorizado'
const FORBIDDEN = 'Prohibido'
const NOT_FOUND = 'No encontrado'

async function assertGestionUsuario(): Promise<
  | { ok: true; requesterUid: string; requesterEmail: string | undefined }
  | { ok: false; response: NextResponse }
> {
  const store = await cookies()
  const cookie = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!cookie) {
    return { ok: false, response: NextResponse.json({ error: UNAUTHORIZED }, { status: 401 }) }
  }

  let requesterUid: string
  let requesterEmail: string | undefined
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    requesterUid = decoded.uid
    requesterEmail = typeof decoded.email === 'string' ? decoded.email : undefined
  } catch {
    return { ok: false, response: NextResponse.json({ error: UNAUTHORIZED }, { status: 401 }) }
  }

  const perfilRequester = await getUserProfileForSidebar(requesterUid, requesterEmail)
  if (!canManageUsers(perfilRequester?.role)) {
    return { ok: false, response: NextResponse.json({ error: FORBIDDEN }, { status: 403 }) }
  }

  return { ok: true, requesterUid, requesterEmail }
}

function firebaseAuthCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: string }).code)
  }
  return ''
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  const { uid: targetUid } = await context.params
  if (!targetUid?.trim()) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const gate = await assertGestionUsuario()
  if (!gate.ok) {
    return gate.response
  }

  const json = (await request.json().catch(() => null)) as unknown
  const parsed = patchBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  if (gate.requesterUid === targetUid && parsed.data.active === false) {
    return NextResponse.json({ error: 'No puede desactivar su propia cuenta' }, { status: 403 })
  }

  const db = getAdminFirestore()
  const auth = getAdminAuth()
  const ref = db.collection(COLECCIONES.usuarios).doc(targetUid)

  try {
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 })
    }

    const raw = snap.data() as Record<string, unknown>
    const nameFs =
      typeof raw.name === 'string'
        ? raw.name.trim()
        : typeof raw.nombre === 'string'
          ? raw.nombre.trim()
          : ''
    const lastFs =
      typeof raw.lastName === 'string'
        ? raw.lastName.trim()
        : typeof raw.apellidos === 'string'
          ? raw.apellidos.trim()
          : typeof raw.apellido === 'string'
            ? raw.apellido.trim()
            : ''

    const body = parsed.data
    const updates: Record<string, unknown> = {}
    const authUpdates: { email?: string; displayName?: string } = {}

    if (body.name !== undefined) {
      updates.name = body.name
    }
    if (body.lastName !== undefined) {
      updates.lastName = body.lastName
    }
    if (body.name !== undefined || body.lastName !== undefined) {
      const fn = body.name !== undefined ? body.name : nameFs
      const ln = body.lastName !== undefined ? body.lastName : lastFs
      const dn = `${fn} ${ln}`.trim()
      if (dn) {
        updates.displayName = dn
        authUpdates.displayName = dn
      }
    }

    if (body.role !== undefined) {
      updates.role = body.role
    }
    if (body.active !== undefined) {
      updates.active = body.active
    }
    if (body.email !== undefined) {
      updates.email = body.email
      authUpdates.email = body.email
    }

    if (Object.keys(authUpdates).length > 0) {
      try {
        await auth.updateUser(targetUid, authUpdates)
      } catch (error: unknown) {
        const code = firebaseAuthCode(error)
        console.error('PATCH /api/users/[uid] auth', targetUid, code)
        if (code === 'auth/email-already-exists') {
          return NextResponse.json({ error: 'Ese correo ya está en uso' }, { status: 409 })
        }
        if (code === 'auth/invalid-email') {
          return NextResponse.json({ error: 'Correo no válido' }, { status: 400 })
        }
        return NextResponse.json({ error: 'No se pudo actualizar la cuenta' }, { status: 400 })
      }
    }

    if (Object.keys(updates).length > 0) {
      await ref.update(updates)
    }

    invalidarCacheUsersList()
    invalidarCacheSidebarUsuario(targetUid)
    return NextResponse.json({ exito: true })
  } catch (error) {
    console.error('PATCH /api/users/[uid]', targetUid, error)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ uid: string }> },
) {
  const { uid: targetUid } = await context.params
  if (!targetUid?.trim()) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const gate = await assertGestionUsuario()
  if (!gate.ok) {
    return gate.response
  }

  if (gate.requesterUid === targetUid) {
    return NextResponse.json({ error: 'No puede eliminar su propia cuenta' }, { status: 403 })
  }

  const db = getAdminFirestore()
  const auth = getAdminAuth()
  const ref = db.collection(COLECCIONES.usuarios).doc(targetUid)

  try {
    const snap = await ref.get()
    if (!snap.exists) {
      return NextResponse.json({ error: NOT_FOUND }, { status: 404 })
    }

    try {
      await auth.deleteUser(targetUid)
    } catch (error: unknown) {
      const code = firebaseAuthCode(error)
      if (code !== 'auth/user-not-found') {
        console.error('DELETE /api/users/[uid] auth', targetUid, code)
        return NextResponse.json({ error: 'No se pudo eliminar la cuenta de acceso' }, { status: 500 })
      }
    }

    await ref.delete()
    invalidarCacheUsersList()
    invalidarCacheSidebarUsuario(targetUid)
    return NextResponse.json({ exito: true })
  } catch (error) {
    console.error('DELETE /api/users/[uid]', targetUid, error)
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
