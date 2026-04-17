import 'server-only'
// Documento único `aggregates/panel`: totales para el dashboard (1 lectura vs N clubes).

import { AggregateField, FieldValue } from 'firebase-admin/firestore'
import { AGGREGATES_DOC_PANEL, COLECCIONES } from '@/constants'
import { getAdminFirestore } from '@/lib/firebase/adminFirebase'

function parseActivo(raw: unknown): boolean {
  if (typeof raw === 'boolean') {
    return raw
  }
  if (raw === 'false' || raw === 0) {
    return false
  }
  return true
}

function refPanel() {
  return getAdminFirestore().collection(COLECCIONES.aggregates).doc(AGGREGATES_DOC_PANEL)
}

/** Conteos por RUT (personas únicas vs en más de un club), precalculados en `aggregates/panel`. */
export type PanelStatsRut = {
  unicos: number
  duplicados: number
}

export type PanelResumenPublico = {
  totalClubes: number
  totalClubesActivos: number
  totalMiembros: number
  /**
   * Si es null, el dashboard no hace lectura masiva de `miembros_club`;
   * un admin puede generar estos valores vía POST /api/admin/miembros/recompute-stats-rut.
   */
  statsRut: PanelStatsRut | null
}

function numSeguro(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Una lectura del doc de agregados; si no existe, reconstruye desde la colección `clubes`. */
export async function obtenerResumenPanelAdmin(): Promise<PanelResumenPublico> {
  try {
    const snap = await refPanel().get()
    if (!snap.exists) {
      return await reconstruirYGuardarResumenPanel()
    }
    const d = snap.data() as Record<string, unknown>
    const incompleto =
      typeof d.totalClubes !== 'number' ||
      typeof d.totalClubesActivos !== 'number' ||
      typeof d.totalMiembros !== 'number'
    if (incompleto) {
      return await reconstruirYGuardarResumenPanel()
    }
    const statsRut =
      typeof d.statsRutUnicos === 'number' && typeof d.statsRutDuplicados === 'number'
        ? {
            unicos: Math.max(0, Math.floor(numSeguro(d.statsRutUnicos))),
            duplicados: Math.max(0, Math.floor(numSeguro(d.statsRutDuplicados))),
          }
        : null
    return {
      totalClubes: Math.max(0, numSeguro(d.totalClubes)),
      totalClubesActivos: Math.max(0, numSeguro(d.totalClubesActivos)),
      totalMiembros: Math.max(0, numSeguro(d.totalMiembros)),
      statsRut,
    }
  } catch (error) {
    console.error('obtenerResumenPanelAdmin', error)
    return { totalClubes: 0, totalClubesActivos: 0, totalMiembros: 0, statsRut: null }
  }
}

/** 
 * Recalcula totales usando agregaciones de Firestore (3 consultas de agregación vs N lecturas de documentos).
 * Esto es extremadamente eficiente en términos de cuota de lectura.
 */
export async function reconstruirYGuardarResumenPanel(): Promise<PanelResumenPublico> {
  const db = getAdminFirestore()
  const col = db.collection(COLECCIONES.clubes)

  try {
    // Realizamos 3 agregaciones en paralelo para minimizar tiempo y lecturas
    const [snapCount, snapSum, snapActivos] = await Promise.all([
      col.count().get(),
      col.aggregate({ sumaMiembros: AggregateField.sum('miembros') }).get(),
      col.where('activo', '==', true).count().get()
    ])

    const totalClubes = snapCount.data().count
    const totalMiembros = snapSum.data().sumaMiembros || 0
    const totalClubesActivos = snapActivos.data().count

    const out = { totalClubes, totalClubesActivos, totalMiembros }

    await refPanel().set(
      {
        ...out,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return { ...out, statsRut: null }
  } catch (error) {
    console.error('reconstruirYGuardarResumenPanel Error:', error)
    // Fallback básico en caso de error en agregaciones (p.ej. falta de índices)
    return { totalClubes: 0, totalClubesActivos: 0, totalMiembros: 0, statsRut: null }
  }
}

export async function panelDeltaTotalMiembros(delta: number): Promise<void> {
  if (delta === 0) {
    return
  }
  try {
    await refPanel().set(
      {
        totalMiembros: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('panelDeltaTotalMiembros', error)
  }
}

export async function panelRegistrarAltaClub(activo: boolean): Promise<void> {
  try {
    await refPanel().set(
      {
        totalClubes: FieldValue.increment(1),
        totalClubesActivos: FieldValue.increment(activo ? 1 : 0),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('panelRegistrarAltaClub', error)
  }
}

/** Al editar un club: ajusta solo `totalClubesActivos` si cambió el flag `activo`. */
export async function panelAjusteActivoClubAlEditar(
  activoAnterior: boolean,
  activoNuevo: boolean,
): Promise<void> {
  if (activoAnterior === activoNuevo) {
    return
  }
  const delta = activoNuevo ? 1 : -1
  try {
    await refPanel().set(
      {
        totalClubesActivos: FieldValue.increment(delta),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('panelAjusteActivoClubAlEditar', error)
  }
}

export async function panelRegistrarBajaClub(activo: boolean, miembrosDelClub: number): Promise<void> {
  const m = Math.max(0, miembrosDelClub)
  try {
    const updates: Record<string, unknown> = {
      totalClubes: FieldValue.increment(-1),
      totalMiembros: FieldValue.increment(-m),
      updatedAt: FieldValue.serverTimestamp(),
    }
    if (activo) {
      updates.totalClubesActivos = FieldValue.increment(-1)
    }
    await refPanel().set(updates, { merge: true })
  } catch (error) {
    console.error('panelRegistrarBajaClub', error)
  }
}

export async function panelAjusteTrasReconteoClub(
  miembrosAnteriores: number,
  miembrosNuevos: number,
): Promise<void> {
  const delta = Math.max(0, miembrosNuevos) - Math.max(0, miembrosAnteriores)
  await panelDeltaTotalMiembros(delta)
}

/** Tras vaciar miembros: contadores de club en 0; totales globales coherentes. */
export async function panelSincronizarTrasVaciarTodos(
  totalClubes: number,
  totalClubesActivos: number,
): Promise<void> {
  try {
    await refPanel().set(
      {
        totalClubes,
        totalClubesActivos,
        totalMiembros: 0,
        statsRutUnicos: 0,
        statsRutDuplicados: 0,
        statsRutUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('panelSincronizarTrasVaciarTodos', error)
  }
}

/** Guarda conteos RUT en `aggregates/panel` (evita releer toda `miembros_club` en cada visita al dashboard). */
export async function guardarStatsRutEnPanel(stats: PanelStatsRut): Promise<void> {
  try {
    await refPanel().set(
      {
        statsRutUnicos: Math.max(0, Math.floor(stats.unicos)),
        statsRutDuplicados: Math.max(0, Math.floor(stats.duplicados)),
        statsRutUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )
  } catch (error) {
    console.error('guardarStatsRutEnPanel', error)
  }
}
