import { revalidateTag } from 'next/cache'

/** KPI + gráficos del panel (evita releer panel + top/bottom clubes en cada visita). */
export const TAG_CACHE_DASHBOARD_DATOS = 'dashboard-datos'

export function invalidarCacheDashboardDatos(): void {
  try {
    revalidateTag(TAG_CACHE_DASHBOARD_DATOS)
  } catch {
    // Solo en runtime Next.
  }
}
