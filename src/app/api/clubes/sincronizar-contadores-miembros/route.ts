// POST: alinea el campo `miembros` de cada club con el número de documentos en `miembros_club`.

import { NextResponse } from 'next/server'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import { invalidarCacheClubesCatalogo } from '@/lib/cache/clubesCatalogo'
import { sincronizarContadoresMiembrosTodosLosClubes } from '@/services/miembro-club.service'

export async function POST() {
  const auth = await assertSesionValida()
  if (auth instanceof NextResponse) {
    return auth
  }
  const forbidden = await assertPuedeGestionar(auth)
  if (forbidden) {
    return forbidden
  }

  const { clubesProcesados } = await sincronizarContadoresMiembrosTodosLosClubes()
  invalidarCacheClubesCatalogo()
  return NextResponse.json({ clubesProcesados })
}
