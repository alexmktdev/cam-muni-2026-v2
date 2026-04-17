// POST: elimina todos los miembros del club indicado y deja su contador en 0.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import { invalidarCachesTrasMutacionMiembrosClub } from '@/lib/cache/trasMutacionMiembrosClub'
import { CONFIRMACION_VACIAR_MIEMBROS_CLUB } from '@/constants'
import { vaciarMiembrosDelClubEnFirestore } from '@/services/miembro-club.service'

const bodySchema = z.object({
  clubId: z.string().trim().min(1).max(128),
  confirmacion: z.literal(CONFIRMACION_VACIAR_MIEMBROS_CLUB),
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

  const json = (await request.json().catch(() => null)) as unknown
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Confirmación incorrecta o clubId inválido' },
      { status: 400 },
    )
  }

  const resultado = await vaciarMiembrosDelClubEnFirestore(parsed.data.clubId)
  if (!resultado.ok) {
    if (resultado.codigo === 'club_invalido') {
      return NextResponse.json({ error: 'El club no existe' }, { status: 404 })
    }
    return NextResponse.json({ error: 'No se pudo completar la operación' }, { status: 500 })
  }

  invalidarCachesTrasMutacionMiembrosClub()
  return NextResponse.json({ documentosEliminados: resultado.documentosEliminados })
}
