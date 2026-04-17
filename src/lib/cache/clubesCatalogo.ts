import { revalidateTag } from 'next/cache'
import { TAG_CACHE_DASHBOARD_DATOS } from '@/lib/cache/dashboardDatos'

/** Listado completo de clubes (GET /api/clubes sin paginación). */
export const TAG_CACHE_CLUBES_CATALOGO = 'clubes-catalogo'

export function invalidarCacheClubesCatalogo(): void {
  try {
    revalidateTag(TAG_CACHE_CLUBES_CATALOGO)
    revalidateTag(TAG_CACHE_DASHBOARD_DATOS)
  } catch {
    // revalidateTag solo en runtime Next.
  }
}
