// POST: tras migración sin datos de miembros — vacía `miembros_club` y deja `miembros: 0` en todos los clubes.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import { invalidarCachesTrasMutacionMiembrosClub } from '@/lib/cache/trasMutacionMiembrosClub'
import { CONFIRMACION_RESET_MIEMBROS_POST_IMPORT } from '@/constants'
import { vaciarTodosLosMiembrosClubEnFirestore } from '@/services/miembro-club.service'

const bodySchema = z.object({
  confirmacion: z.literal(CONFIRMACION_RESET_MIEMBROS_POST_IMPORT),
})

export async function POST(request: Request) {
  const auth = await assertSesionValida()
  if (auth instanceof NextResponse) {
    return auth
  }
  const forbidden = await assertPuedeGestionar(auth)
  if (forbidden) {
    return forbidden
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Confirmación incorrecta' }, { status: 400 })
  }

  const resultado = await vaciarTodosLosMiembrosClubEnFirestore()
  if (!resultado.ok) {
    return NextResponse.json({ error: 'No se pudo completar el reset' }, { status: 500 })
  }

  invalidarCachesTrasMutacionMiembrosClub()
  return NextResponse.json({
    documentosEliminados: resultado.documentosEliminados,
    clubesConContadorReseteado: resultado.clubesConContadorReseteado,
  })
}
