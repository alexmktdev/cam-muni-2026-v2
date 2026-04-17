// DTO de club para la capa de presentación (sin datos sensibles).

/** Totales globales (documento `aggregates/panel`) para KPIs del listado de clubes. */
export type ClubesResumenTotales = {
  totalClubes: number
  totalClubesActivos: number
  totalMiembros: number
}

export type ClubCliente = {
  id: string
  nombre: string
  comuna: string
  region: string
  activo: boolean
  /** Conteo almacenado en el documento (p. ej. campo `miembros`). */
  miembros: number
  /** Valor para `?club=` en la URL (nombre normalizado; único entre el listado). */
  slugUrl: string
}
