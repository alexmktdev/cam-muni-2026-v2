import { invalidarCacheClubesCatalogo } from '@/lib/cache/clubesCatalogo'
import { invalidarCacheMiembrosClubApi } from '@/lib/cache/miembrosClubApi'
import { invalidarCacheMiembrosConsolidado } from '@/lib/cache/miembrosConsolidado'

/** Tras crear/editar/borrar miembros o importar: consolidado, clubes, listados GET miembros (Next cache). */
export function invalidarCachesTrasMutacionMiembrosClub(): void {
  invalidarCacheMiembrosConsolidado()
  invalidarCacheMiembrosClubApi()
  invalidarCacheClubesCatalogo()
}
