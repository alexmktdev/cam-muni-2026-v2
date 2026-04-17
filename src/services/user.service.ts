import 'server-only'
// User profile reads from Firestore via Admin SDK only.

import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { COLECCIONES, ROL_ALTA_USUARIO_PANEL } from '@/constants'
import {
  findDocumentsByField,
  getAdminAuth,
  getAdminFirestore,
  getDocumentById,
} from '@/lib/firebase/adminFirebase'
import type { UserProfile, UsuarioListaCliente } from '@/types/user.types'

function timestampAISO(raw: unknown): string | undefined {
  if (raw == null) {
    return undefined
  }
  if (raw instanceof Timestamp) {
    return raw.toDate().toISOString()
  }
  if (typeof raw === 'object' && raw !== null && '_seconds' in raw) {
    const s = (raw as { _seconds: unknown })._seconds
    if (typeof s === 'number' && Number.isFinite(s)) {
      return new Date(s * 1000).toISOString()
    }
  }
  if (typeof raw === 'string') {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
  }
  return undefined
}

function parseUserProfile(raw: Record<string, unknown> | null): UserProfile | null {
  if (!raw) {
    return null
  }
  const correo =
    typeof raw.correo === 'string'
      ? raw.correo
      : typeof raw.email === 'string'
        ? raw.email
        : ''
  const tieneNombre =
    typeof raw.displayName === 'string' ||
    typeof raw.nombreMostrar === 'string' ||
    typeof raw.nombreCompleto === 'string' ||
    typeof raw.nombre === 'string' ||
    typeof raw.name === 'string' ||
    typeof raw.lastName === 'string'
  if (!correo && !tieneNombre) {
    return null
  }
  const user: UserProfile = { correo }
  if (typeof raw.displayName === 'string') {
    user.displayName = raw.displayName
  }
  if (typeof raw.nombreMostrar === 'string') {
    user.nombreMostrar = raw.nombreMostrar
  }
  if (typeof raw.nombreCompleto === 'string') {
    user.nombreCompleto = raw.nombreCompleto
  }
  if (typeof raw.nombre === 'string') {
    user.nombre = raw.nombre
  } else if (typeof raw.name === 'string') {
    user.nombre = raw.name
  }
  if (typeof raw.apellidos === 'string') {
    user.apellidos = raw.apellidos
  } else if (typeof raw.apellido === 'string') {
    user.apellido = raw.apellido
  } else if (typeof raw.lastName === 'string') {
    user.apellidos = raw.lastName
  }
  if (typeof raw.creadoEn === 'string') {
    user.creadoEn = raw.creadoEn
  }
  const roleStr =
    typeof raw.role === 'string'
      ? raw.role
      : typeof raw.rol === 'string'
        ? raw.rol
        : typeof raw.userRole === 'string'
          ? raw.userRole
          : typeof raw.tipoRol === 'string'
            ? raw.tipoRol
            : undefined
  if (roleStr) {
    user.role = roleStr
  }
  if (typeof raw.active === 'boolean') {
    user.active = raw.active
  }
  const fechaIso =
    timestampAISO(raw.createdAt) ||
    timestampAISO(raw.created_at) ||
    timestampAISO(raw.fechaCreacion) ||
    (typeof raw.creadoEn === 'string' ? timestampAISO(raw.creadoEn) : undefined) ||
    timestampAISO(raw.lastConnection)
  if (fechaIso) {
    user.fechaRegistroISO = fechaIso
  }
  /** Nombre completo tal como en BD: `name` + `lastName` (o `nombre` + `apellidos`). */
  if (!user.nombreMostrar?.trim()) {
    const n = user.nombre?.trim()
    const a = user.apellidos?.trim() || user.apellido?.trim()
    if (n && a) {
      user.nombreMostrar = `${n} ${a}`
    }
  }
  return user
}

/** Nombre para mostrar en UI a partir del documento Firestore (orden de prioridad estable). */
export function nombreVisibleDesdePerfil(perfil: UserProfile | null): string | null {
  if (!perfil) {
    return null
  }
  const nm = perfil.nombreMostrar?.trim()
  if (nm) {
    return nm
  }
  const dn = perfil.displayName?.trim()
  if (dn) {
    return dn
  }
  const nc = perfil.nombreCompleto?.trim()
  if (nc) {
    return nc
  }
  const n = perfil.nombre?.trim()
  const ap = perfil.apellidos?.trim() || perfil.apellido?.trim()
  if (n && ap) {
    return `${n} ${ap}`
  }
  if (n) {
    return n
  }
  return null
}

export type UsuarioListado = { uid: string } & UserProfile

export function inicialesParaAvatar(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length >= 2) {
    const a = partes[0]?.[0] ?? ''
    const b = partes[1]?.[0] ?? ''
    return (a + b).toUpperCase()
  }
  if (partes.length === 1 && partes[0]!.length >= 2) {
    return partes[0]!.slice(0, 2).toUpperCase()
  }
  return '—'
}

export function formatoFechaListaUsuario(iso?: string): string {
  if (!iso) {
    return '—'
  }
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return '—'
  }
  return d.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function mapUsuarioListadoToCliente(u: UsuarioListado): UsuarioListaCliente {
  const nombre = nombreVisibleDesdePerfil(u) || '—'
  const name = (u.nombre ?? '').trim()
  const lastName = (u.apellidos ?? u.apellido ?? '').trim()
  return {
    id: u.uid,
    nombre,
    iniciales: inicialesParaAvatar(nombre),
    email: u.correo || '—',
    role: u.role?.trim() || 'Usuario',
    active: u.active !== false,
    fechaCreacion: formatoFechaListaUsuario(u.fechaRegistroISO),
    name,
    lastName,
  }
}

/** Lista documentos de la colección `users` (solo servidor; sesión ya validada en layout). */
export async function listUsuariosFromFirestore(): Promise<UsuarioListado[]> {
  try {
    const snap = await getAdminFirestore().collection(COLECCIONES.usuarios).get()
    const out: UsuarioListado[] = []
    for (const doc of snap.docs) {
      const parsed = parseUserProfile(doc.data() as Record<string, unknown>)
      if (!parsed) {
        continue
      }
      out.push({ uid: doc.id, ...parsed })
    }
    out.sort((a, b) => {
      const na = nombreVisibleDesdePerfil(a) || a.correo || a.uid
      const nb = nombreVisibleDesdePerfil(b) || b.correo || b.uid
      return na.localeCompare(nb, 'es', { sensitivity: 'base' })
    })
    return out
  } catch (error) {
    console.error('listUsuariosFromFirestore', error)
    return []
  }
}

/** Load user profile by uid (document id = Auth uid). */
export async function getUserById(uid: string): Promise<UserProfile | null> {
  const raw = await getDocumentById(COLECCIONES.usuarios, uid)
  return parseUserProfile(raw)
}

import { cache } from 'react'

/**
 * Resuelve perfil para la barra lateral: documento con id = uid, o mismo `email` en `users`
 * (cuando el id del documento no coincide con Auth).
 */
export const getUserProfileForSidebar = cache(async (
  uid: string,
  email?: string | null,
): Promise<UserProfile | null> => {
  const porId = await getUserById(uid)
  if (porId) {
    return porId
  }
  const mail = email?.trim()
  if (!mail) {
    return null
  }
  const variants = [...new Set([mail, mail.toLowerCase()])]
  for (const m of variants) {
    const rows = await findDocumentsByField(COLECCIONES.usuarios, 'email', m)
    if (rows.length > 0) {
      const row = rows[0]!
      const { id: _docId, ...data } = row
      return parseUserProfile(data as Record<string, unknown>)
    }
  }
  return null
})

export type CrearUsuarioPanelInput = {
  nombre: string
  apellido: string
  email: string
  password: string
}

export type CrearUsuarioPanelResult =
  | { ok: true }
  | { ok: false; codigo: 'email_existe' | 'datos_invalidos' | 'interno' }

/**
 * Crea usuario en Firebase Auth y documento en `users` con rol fijo (panel).
 * Si Firestore falla tras crear Auth, revoca el usuario en Auth.
 */
export async function crearUsuarioDesdePanel(
  input: CrearUsuarioPanelInput,
): Promise<CrearUsuarioPanelResult> {
  const nombre = input.nombre.trim()
  const apellido = input.apellido.trim()
  const email = input.email.trim().toLowerCase()
  const auth = getAdminAuth()
  const db = getAdminFirestore()
  let uid: string | null = null

  try {
    const record = await auth.createUser({
      email,
      password: input.password,
      displayName: `${nombre} ${apellido}`.trim(),
    })
    uid = record.uid
  } catch (error: unknown) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : ''
    console.error('crearUsuarioDesdePanel auth', code)
    if (code === 'auth/email-already-exists') {
      return { ok: false, codigo: 'email_existe' }
    }
    if (
      code === 'auth/invalid-email' ||
      code === 'auth/invalid-password' ||
      code === 'auth/weak-password'
    ) {
      return { ok: false, codigo: 'datos_invalidos' }
    }
    return { ok: false, codigo: 'interno' }
  }

  try {
    await db
      .collection(COLECCIONES.usuarios)
      .doc(uid)
      .set({
        email,
        name: nombre,
        lastName: apellido,
        role: ROL_ALTA_USUARIO_PANEL,
        active: true,
        createdAt: FieldValue.serverTimestamp(),
      })
  } catch (error) {
    console.error('crearUsuarioDesdePanel firestore', uid, error)
    try {
      await auth.deleteUser(uid)
    } catch (rollbackError) {
      console.error('crearUsuarioDesdePanel rollback', rollbackError)
    }
    return { ok: false, codigo: 'interno' }
  }

  return { ok: true }
}
