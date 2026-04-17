// GET: business data for the signed-in user (Firestore via server).

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NOMBRE_COOKIE_SESION } from '@/constants'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'
import { getUserById } from '@/services/user.service'

const UNAUTHORIZED = 'No autorizado'

export async function GET() {
  try {
    const store = await cookies()
    const value = store.get(NOMBRE_COOKIE_SESION)?.value
    if (!value) {
      return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
    }
    const auth = getAdminAuth()
    let uid: string
    try {
      const decoded = await auth.verifySessionCookie(value, true)
      uid = decoded.uid
    } catch (error) {
      console.error('verifySessionCookie /api/data', error)
      return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
    }
    const user = await getUserById(uid)
    const titulo = user?.nombreMostrar
      ? `Hola, ${user.nombreMostrar}`
      : 'Resumen de tu cuenta'
    const detalle = user
      ? `Correo en perfil: ${user.correo}. Los datos provienen de Firestore (servidor).`
      : 'Aún no hay documento en la colección users con tu uid; crea uno con los campos email, name, lastName.'
    return NextResponse.json({
      exito: true,
      datos: { titulo, detalle },
    })
  } catch (error) {
    console.error('GET /api/data', error)
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 })
  }
}
