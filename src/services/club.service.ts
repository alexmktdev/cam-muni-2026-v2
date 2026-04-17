import 'server-only'
// Lectura y alta de clubes en Firestore vía Admin SDK.

import { FieldPath, FieldValue } from 'firebase-admin/firestore'
import { COLECCIONES } from '@/constants'
import { getAdminFirestore, getDocumentById } from '@/lib/firebase/adminFirebase'
import {
  panelAjusteActivoClubAlEditar,
  panelRegistrarAltaClub,
  panelRegistrarBajaClub,
} from '@/services/panel-resumen.service'
import { normalizarNombreClubCam } from '@/lib/club/normalizarNombreCam'
import { adjuntarSlugUrlACadaClub } from '@/lib/club/slugUrlClub'
import type { ClubCliente } from '@/types/club.types'

export { normalizarNombreClubCam }

function str(raw: unknown, fallback = ''): string {
  return typeof raw === 'string' ? raw.trim() : fallback
}

function miembrosDesdeCampos(...candidatos: unknown[]): number {
  for (const raw of candidatos) {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return Math.max(0, Math.floor(raw))
    }
    if (typeof raw === 'string' && /^\d+$/.test(raw.trim())) {
      return Math.max(0, parseInt(raw.trim(), 10))
    }
  }
  return 0
}

function parseActivo(raw: unknown): boolean {
  if (typeof raw === 'boolean') {
    return raw
  }
  if (raw === 'false' || raw === 0) {
    return false
  }
  return true
}

export type ClubClienteSinSlugUrl = Omit<ClubCliente, 'slugUrl'>

export function mapClubDocToCliente(id: string, data: Record<string, unknown>): ClubClienteSinSlugUrl {
  const nombreBase =
    str(data.nombre) || str(data.name) || str(data.nombreClub) || ''
  const nombre =
    nombreBase.length === 0 ? 'Sin nombre' : normalizarNombreClubCam(nombreBase)
  const comuna = str(data.comuna) || str(data.ciudad) || '—'
  const region = str(data.region) || str(data.región) || str(data.Region) || '—'
  const miembros = miembrosDesdeCampos(
    data.miembros,
    data.memberCount,
    data.totalMiembros,
    data.membresias,
  )
  return {
    id,
    nombre,
    comuna,
    region,
    activo: parseActivo(data.activo ?? data.active),
    miembros,
  }
}

export type ClubListado = ClubCliente

const CLUB_PAGE_MAX = 50

/** Página 1-based de clubes (`offset` en Firestore; orden `nombre`, id documento). */
export async function listClubesPaged(
  page: number,
  pageSize: number,
): Promise<{ clubes: ClubListado[] }> {
  const lim = Math.min(Math.max(1, pageSize), CLUB_PAGE_MAX)
  const p = Math.max(1, page)
  const offset = (p - 1) * lim
  try {
    const col = getAdminFirestore().collection(COLECCIONES.clubes)
    const snap = await col
      .orderBy('nombre')
      .orderBy(FieldPath.documentId())
      .offset(offset)
      .limit(lim)
      .get()
    const out: ClubClienteSinSlugUrl[] = []
    for (const doc of snap.docs) {
      out.push(mapClubDocToCliente(doc.id, doc.data() as Record<string, unknown>))
    }
    return { clubes: adjuntarSlugUrlACadaClub(out) }
  } catch (error) {
    console.error('listClubesPaged', error)
    return { clubes: [] }
  }
}

const CHART_CLUBES_LIMIT = 10

/**
 * Top / bottom clubes por campo `miembros` con solo 2×limit lecturas (vs toda la colección).
 * Si falla el orderBy (índice / datos), hace fallback a listar todo.
 */
export async function listClubesTopBottomPorMiembros(
  limit = CHART_CLUBES_LIMIT,
): Promise<{
  top: { nombre: string; miembros: number }[]
  bottom: { nombre: string; miembros: number }[]
}> {
  const lim = Math.min(Math.max(1, limit), 50)
  const db = getAdminFirestore()
  const col = db.collection(COLECCIONES.clubes)
  try {
    const [snapDesc, snapAsc] = await Promise.all([
      col.orderBy('miembros', 'desc').limit(lim).get(),
      col.orderBy('miembros', 'asc').limit(lim).get(),
    ])
    const fila = (id: string, data: Record<string, unknown>) => {
      const c = mapClubDocToCliente(id, data)
      return { nombre: c.nombre, miembros: c.miembros }
    }
    return {
      top: snapDesc.docs.map((d) => fila(d.id, d.data() as Record<string, unknown>)),
      bottom: snapAsc.docs.map((d) => fila(d.id, d.data() as Record<string, unknown>)),
    }
  } catch (error) {
    console.error('listClubesTopBottomPorMiembros', error)
    const all = await listClubesFromFirestore()
    const porM = [...all].sort((a, b) => b.miembros - a.miembros)
    const top = porM.slice(0, lim).map((c) => ({ nombre: c.nombre, miembros: c.miembros }))
    const bottom = [...porM]
      .sort((a, b) => a.miembros - b.miembros)
      .slice(0, lim)
      .map((c) => ({ nombre: c.nombre, miembros: c.miembros }))
    return { top, bottom }
  }
}

/** Lista todos los documentos de la colección `clubes`. */
export async function listClubesFromFirestore(): Promise<ClubListado[]> {
  try {
    const snap = await getAdminFirestore().collection(COLECCIONES.clubes).get()
    const out: ClubClienteSinSlugUrl[] = []
    for (const doc of snap.docs) {
      const data = doc.data() as Record<string, unknown>
      out.push(mapClubDocToCliente(doc.id, data))
    }
    out.sort((a, b) =>
      a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }),
    )
    return adjuntarSlugUrlACadaClub(out)
  } catch (error) {
    console.error('listClubesFromFirestore', error)
    return []
  }
}

/** Un club por id (p. ej. tras crear, sin releer toda la colección). */
export async function obtenerClubClientePorId(id: string): Promise<ClubListado | null> {
  const raw = await getDocumentById(COLECCIONES.clubes, id)
  if (!raw) {
    return null
  }
  const base = mapClubDocToCliente(id, raw)
  const [conSlug] = adjuntarSlugUrlACadaClub([base])
  return conSlug ?? null
}

export type CrearClubInput = {
  nombre: string
  comuna: string
  region: string
  activo: boolean
}

export async function crearClubEnFirestore(
  input: CrearClubInput,
): Promise<{ ok: true; id: string; nombre: string } | { ok: false }> {
  try {
    const nombre = normalizarNombreClubCam(input.nombre)
    if (!nombre) {
      return { ok: false }
    }
    const ref = await getAdminFirestore().collection(COLECCIONES.clubes).add({
      nombre,
      comuna: input.comuna,
      region: input.region,
      activo: input.activo,
      miembros: 0,
      createdAt: FieldValue.serverTimestamp(),
    })
    await panelRegistrarAltaClub(input.activo)
    return { ok: true, id: ref.id, nombre }
  } catch (error) {
    console.error('crearClubEnFirestore', error)
    return { ok: false }
  }
}

export type ActualizarClubInput = {
  nombre: string
  comuna: string
  region: string
  activo: boolean
}

export async function actualizarClubEnFirestore(
  id: string,
  input: ActualizarClubInput,
): Promise<{ ok: true } | { ok: false; razon: 'not_found' | 'invalid' }> {
  try {
    const nombre = normalizarNombreClubCam(input.nombre)
    if (!nombre) {
      return { ok: false, razon: 'invalid' }
    }
    const ref = getAdminFirestore().collection(COLECCIONES.clubes).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return { ok: false, razon: 'not_found' }
    }
    const data = snap.data() as Record<string, unknown>
    const activoAnterior = parseActivo(data.activo ?? data.active)
    const activoNuevo = input.activo
    await ref.update({
      nombre,
      comuna: input.comuna.trim(),
      region: input.region.trim(),
      activo: activoNuevo,
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (activoAnterior !== activoNuevo) {
      await panelAjusteActivoClubAlEditar(activoAnterior, activoNuevo)
    }
    return { ok: true }
  } catch (error) {
    console.error('actualizarClubEnFirestore', id, error)
    return { ok: false, razon: 'invalid' }
  }
}

export async function eliminarClubEnFirestore(id: string): Promise<boolean> {
  try {
    const ref = getAdminFirestore().collection(COLECCIONES.clubes).doc(id)
    const snap = await ref.get()
    if (!snap.exists) {
      return false
    }
    const data = snap.data() as Record<string, unknown>
    const activo = parseActivo(data.activo ?? data.active)
    const miembros = miembrosDesdeCampos(
      data.miembros,
      data.memberCount,
      data.totalMiembros,
      data.membresias,
    )
    await ref.delete()
    await panelRegistrarBajaClub(activo, miembros)
    return true
  } catch (error) {
    console.error('eliminarClubEnFirestore', id, error)
    return false
  }
}
