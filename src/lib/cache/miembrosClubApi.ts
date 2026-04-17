import { revalidateTag } from 'next/cache'

/** Respuestas GET /api/miembros-club (paginación y búsqueda). */
export const TAG_CACHE_MIEMBROS_CLUB_API = 'miembros-club-api'

export function invalidarCacheMiembrosClubApi(): void {
  try {
    revalidateTag(TAG_CACHE_MIEMBROS_CLUB_API)
  } catch {
    // Solo en runtime Next.
  }
}
