// POST multipart: importar base de datos global de miembros desde CSV estructurado en columnas.

import { NextResponse } from 'next/server'
import { assertPuedeGestionar, assertSesionValida } from '@/lib/api/assertSessionGestion'
import { invalidarCachesTrasMutacionMiembrosClub } from '@/lib/cache/trasMutacionMiembrosClub'
import { importarMasivoDesdeCsv } from '@/services/importacion-masiva.service'

// Configuramos un límite mucho más indulgente por ser una importación gigante a nivel sistema.
// Permitimos archivos de hasta 15MB.
const MAX_BYTES = 15 * 1024 * 1024

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
    return NextResponse.json({ error: 'Fallo al procesar el formulario de envío' }, { status: 400 })
  }

  const file = form.get('archivo')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Debe adjuntar un archivo CSV obligatoriamente.' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Archivo demasiado pesado. El límite de plataforma masiva es de 15 MB.' }, { status: 400 })
  }

  try {
    const texto = await file.text()
    const resultado = await importarMasivoDesdeCsv(texto)
    invalidarCachesTrasMutacionMiembrosClub()
    return NextResponse.json(resultado)
  } catch (error: any) {
    console.error('Error durante importacion masiva:', error)
    return NextResponse.json({ error: 'Ocurrió un error interno durante el procesamiento del archivo: ' + String(error.message) }, { status: 500 })
  }
}
