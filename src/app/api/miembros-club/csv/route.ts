// POST multipart: importar miembros desde CSV (nombre completo + RUT) para un club.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import { invalidarCachesTrasMutacionMiembrosClub } from '@/lib/cache/trasMutacionMiembrosClub'
import { importarCsvMiembrosClub } from '@/services/miembro-club.service'

const MAX_BYTES = 5 * 1024 * 1024

const clubIdSchema = z.string().trim().min(1).max(128)

export async function POST(request: Request) {
  const auth = await assertSesionValida()
  if (auth instanceof NextResponse) {
    return auth
  }
  const forbidden = await assertPuedeGestionar(auth)
  if (forbidden) {
    return forbidden
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Formulario inválido' }, { status: 400 })
  }

  const clubRaw = form.get('clubId')
  const clubParsed = clubIdSchema.safeParse(typeof clubRaw === 'string' ? clubRaw : '')
  if (!clubParsed.success) {
    return NextResponse.json({ error: 'Indique un club válido' }, { status: 400 })
  }

  const file = form.get('archivo')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Debe adjuntar un archivo CSV' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Archivo demasiado grande (máx. 5 MB)' }, { status: 400 })
  }

  const texto = await file.text()
  const resultado = await importarCsvMiembrosClub(clubParsed.data, texto)
  invalidarCachesTrasMutacionMiembrosClub()
  return NextResponse.json(resultado)
}
