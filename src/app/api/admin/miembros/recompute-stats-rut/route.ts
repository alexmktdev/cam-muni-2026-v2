// POST: recalcula conteos únicos/duplicados por RUT y los guarda en aggregates/panel (lectura masiva única).

import { NextResponse } from 'next/server'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import { invalidarCacheDashboardDatos } from '@/lib/cache/dashboardDatos'
import { invalidarCacheMiembrosConsolidado } from '@/lib/cache/miembrosConsolidado'
import { recomputarYGuardarStatsRutEnPanel } from '@/services/busqueda-miembros.service'

export async function POST() {
  const auth = await assertSesionValida()
  if (auth instanceof NextResponse) {
    return auth
  }
  const forbidden = await assertPuedeGestionar(auth)
  if (forbidden) {
    return forbidden
  }

  try {
    const stats = await recomputarYGuardarStatsRutEnPanel()
    invalidarCacheMiembrosConsolidado()
    invalidarCacheDashboardDatos()
    return NextResponse.json({ exito: true, stats })
  } catch (error) {
    console.error('POST recompute-stats-rut', error)
    return NextResponse.json({ error: 'No se pudo recalcular las estadísticas RUT' }, { status: 500 })
  }
}
