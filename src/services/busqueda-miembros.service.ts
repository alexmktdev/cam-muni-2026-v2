import 'server-only'
import { COLECCIONES } from '@/constants'
import { getAdminFirestore } from '@/lib/firebase/adminFirebase'
import { listClubesFromFirestore } from '@/services/club.service'
import { guardarStatsRutEnPanel } from '@/services/panel-resumen.service'

export type MiembroConsolidado = {
  rut: string
  nombreCompleto: string
  clubes: { id: string; nombre: string }[]
  esDuplicado: boolean
}

export type EstadisticasBusqueda = {
  total: number
  duplicados: number
  unicos: number
}

export type RespuestaBusquedaConsolidada = {
  miembros: MiembroConsolidado[]
  stats: EstadisticasBusqueda
}

/** Agrupa filas de `miembros_club` por RUT (una lectura de la colección). */
async function buildAgrupadosPorRut(
  clubNombrePorId?: Map<string, string>,
): Promise<Map<string, MiembroConsolidado>> {
  const db = getAdminFirestore()
  const clubMap =
    clubNombrePorId ??
    new Map((await listClubesFromFirestore()).map((c) => [c.id, c.nombre]))
  const snap = await db.collection(COLECCIONES.miembrosClub).get()
  const agrupados = new Map<string, MiembroConsolidado>()

  for (const doc of snap.docs) {
    const data = doc.data()
    const rut = String(data.rut || '')
      .trim()
      .toUpperCase()
    if (!rut) {
      continue
    }

    const clubId = data.clubId
    const clubNombre = clubMap.get(clubId) || 'Club desconocido'

    const existing = agrupados.get(rut)
    if (existing) {
      if (!existing.clubes.some((c) => c.id === clubId)) {
        existing.clubes.push({ id: clubId, nombre: clubNombre })
        existing.esDuplicado = true
      }
    } else {
      const nombre = String(data.nombre || '').trim()
      const apellidos = String(data.apellidos || '').trim()

      agrupados.set(rut, {
        rut,
        nombreCompleto: `${nombre} ${apellidos}`.trim(),
        clubes: [{ id: clubId, nombre: clubNombre }],
        esDuplicado: false,
      })
    }
  }

  return agrupados
}

/**
 * Solo totales (personas únicas por RUT y cuántas están en más de un club).
 * Si pasa `clubNombrePorId`, evita releer la colección `clubes` (p. ej. panel de control).
 */
export async function obtenerEstadisticasConsolidadasMiembros(
  clubNombrePorId?: Map<string, string>,
): Promise<EstadisticasBusqueda> {
  try {
    const agrupados = await buildAgrupadosPorRut(clubNombrePorId)
    const lista = Array.from(agrupados.values())
    return {
      total: lista.length,
      duplicados: lista.filter((m) => m.esDuplicado).length,
      unicos: lista.filter((m) => !m.esDuplicado).length,
    }
  } catch (error) {
    console.error('Error en obtenerEstadisticasConsolidadasMiembros:', error)
    return { total: 0, duplicados: 0, unicos: 0 }
  }
}

/**
 * Obtiene todos los miembros de todos los clubes y los agrupa por RUT.
 * Resuelve los nombres de los clubes para que el cliente no tenga que hacer más peticiones.
 */
/**
 * Recorre toda `miembros_club` (muchas lecturas) y guarda solo los conteos en `aggregates/panel`.
 * Usar desde un botón o tarea explícita, no en cada navegación.
 */
export async function recomputarYGuardarStatsRutEnPanel(): Promise<EstadisticasBusqueda> {
  const stats = await obtenerEstadisticasConsolidadasMiembros()
  await guardarStatsRutEnPanel({ unicos: stats.unicos, duplicados: stats.duplicados })
  return stats
}

export async function obtenerTodosLosMiembrosConsolidados(): Promise<RespuestaBusquedaConsolidada> {
  try {
    const agrupados = await buildAgrupadosPorRut()
    const lista = Array.from(agrupados.values())

    const stats: EstadisticasBusqueda = {
      total: lista.length,
      duplicados: lista.filter((m) => m.esDuplicado).length,
      unicos: lista.filter((m) => !m.esDuplicado).length,
    }

    lista.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))

    return {
      miembros: lista,
      stats,
    }
  } catch (error) {
    console.error('Error en obtenerTodosLosMiembrosConsolidados:', error)
    return {
      miembros: [],
      stats: { total: 0, duplicados: 0, unicos: 0 },
    }
  }
}
