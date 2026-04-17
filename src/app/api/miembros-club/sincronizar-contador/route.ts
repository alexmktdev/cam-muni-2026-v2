// POST: alinea el campo `miembros` del club con el conteo real en `miembros_club` (un club).

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import {
  clubDocumentoExiste,
  contarMiembrosPorClub,
  sincronizarContadorMiembrosEnClub,
} from '@/services/miembro-club.service'

const bodySchema = z.object({
  clubId: z.string().trim().min(1).max(128),
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
    return NextResponse.json({ error: 'clubId inválido' }, { status: 400 })
  }

  const { clubId } = parsed.data
  if (!(await clubDocumentoExiste(clubId))) {
    return NextResponse.json({ error: 'El club no existe' }, { status: 404 })
  }

  await sincronizarContadorMiembrosEnClub(clubId)
  const miembros = await contarMiembrosPorClub(clubId)
  return NextResponse.json({ miembros })
}
