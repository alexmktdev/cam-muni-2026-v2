// Tag de caché de Next para la respuesta pesada de /api/admin/miembros/consolidado.

import { revalidateTag } from 'next/cache'

export const TAG_CACHE_MIEMBROS_CONSOLIDADO = 'miembros-consolidado'

/** Invalida la caché del listado consolidado (tras alta/baja/importación de miembros). */
export function invalidarCacheMiembrosConsolidado(): void {
  try {
    revalidateTag(TAG_CACHE_MIEMBROS_CONSOLIDADO)
  } catch {
    // revalidateTag solo aplica en runtime de Next (no en todos los entornos de test).
  }
}
