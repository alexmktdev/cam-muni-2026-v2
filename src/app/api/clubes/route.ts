// GET: listar clubes (sesión). POST: crear club (sesión + permiso de gestión).

import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import {
  invalidarCacheClubesCatalogo,
  TAG_CACHE_CLUBES_CATALOGO,
} from '@/lib/cache/clubesCatalogo'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'
import {
  crearClubEnFirestore,
  listClubesFromFirestore,
  listClubesPaged,
  obtenerClubClientePorId,
} from '@/services/club.service'
import { obtenerResumenPanelAdmin } from '@/services/panel-resumen.service'
import { getUserProfileForSidebar } from '@/services/user.service'

const UNAUTHORIZED = 'No autorizado'
const FORBIDDEN = 'Prohibido'

const limitQuery = z.coerce.number().int().min(1).max(50)
const pageQuery = z.coerce.number().int().min(1).max(5000)

const listadoClubesCompletoCacheado = unstable_cache(
  () => listClubesFromFirestore(),
  ['api-clubes-full-v1'],
  { revalidate: 1800, tags: [TAG_CACHE_CLUBES_CATALOGO] },
)

const postBodySchema = z.object({
  /** Sin prefijo CAM en el formulario; el servidor añade "CAM " (máx. ~200 caracteres guardados). */
  nombre: z.string().trim().min(1).max(196),
  comuna: z.string().trim().min(1).max(120),
  region: z.string().trim().min(1).max(120),
  activo: z.boolean(),
})

async function sesionVerificada(): Promise<
  NextResponse | { uid: string; email?: string }
> {
  const store = await cookies()
  const cookie = store.get(NOMBRE_COOKIE_SESION)?.value
  if (!cookie) {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }
  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true)
    const uid = decoded.uid
    const email = typeof decoded.email === 'string' ? decoded.email : undefined
    return { uid, email }
  } catch {
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }
}

export async function GET(request: Request) {
  const auth = await sesionVerificada()
  if (auth instanceof NextResponse) {
    return auth
  }

  const { searchParams } = new URL(request.url)
  const rawLimit = searchParams.get('limit')
  if (rawLimit !== null && rawLimit !== '') {
    const limParsed = limitQuery.safeParse(rawLimit)
    if (!limParsed.success) {
      return NextResponse.json({ error: 'Parámetro limit inválido (1–50)' }, { status: 400 })
    }
    const pageParsed = pageQuery.safeParse(searchParams.get('page') ?? '1')
    if (!pageParsed.success) {
      return NextResponse.json({ error: 'Parámetro page inválido' }, { status: 400 })
    }
    const [paged, panel] = await Promise.all([
      listClubesPaged(pageParsed.data, limParsed.data),
      obtenerResumenPanelAdmin(),
    ])
    return NextResponse.json({
      clubes: paged.clubes,
      page: pageParsed.data,
      pageSize: limParsed.data,
      panel: {
        totalClubes: panel.totalClubes,
        totalClubesActivos: panel.totalClubesActivos,
        totalMiembros: panel.totalMiembros,
      },
    })
  }

  const rows = await listadoClubesCompletoCacheado()
  return NextResponse.json({ clubes: rows })
}

export async function POST(request: Request) {
  const auth = await sesionVerificada()
  if (auth instanceof NextResponse) {
    return auth
  }

  const perfilRequester = await getUserProfileForSidebar(auth.uid, auth.email)
  if (!canManageUsers(perfilRequester?.role)) {
    return NextResponse.json({ error: FORBIDDEN }, { status: 403 })
  }

  const json = (await request.json().catch(() => null)) as unknown
  const parsed = postBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  const resultado = await crearClubEnFirestore(parsed.data)
  if (!resultado.ok) {
    return NextResponse.json({ error: 'No se pudo crear el club' }, { status: 500 })
  }

  const club = await obtenerClubClientePorId(resultado.id)
  if (!club) {
    return NextResponse.json({ error: 'No se pudo cargar el club creado' }, { status: 500 })
  }

  invalidarCacheClubesCatalogo()
  return NextResponse.json({ club }, { status: 201 })
}
