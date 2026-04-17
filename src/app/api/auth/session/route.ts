// POST: crear cookie de sesión a partir de idToken (emitido en el cliente tras email/contraseña).
// DELETE: cerrar sesión y revocar tokens.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase/adminFirebase'
import { clearLoginFailures, getClientIpFromHeaders } from '@/lib/security/loginAttemptPolicy'
import { createSessionCookieFromIdToken } from '@/lib/session/createSession'
import { closeServerSession } from '@/lib/session/closeSession'

/**
 * El login con email/contraseña se hace en el navegador (Firebase Client SDK).
 * Llamar a Identity Toolkit desde el servidor con la misma API key web suele devolver
 * INVALID_LOGIN_CREDENTIALS si la clave tiene restricción por referrer HTTP.
 */
const postBodySchema = z.object({
  idToken: z.string().min(1),
})

const UNAUTHORIZED = 'No autorizado'

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as unknown
    const parsed = postBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: UNAUTHORIZED, code: 'api/sesion-servidor' }, { status: 401 })
    }
    const { idToken } = parsed.data
    const ip = getClientIpFromHeaders(request.headers)

    const auth = getAdminAuth()
    let email: string
    try {
      const decoded = await auth.verifyIdToken(idToken, true)
      const mail = typeof decoded.email === 'string' ? decoded.email.trim().toLowerCase() : ''
      if (!mail) {
        return NextResponse.json({ error: UNAUTHORIZED, code: 'api/sesion-servidor' }, { status: 401 })
      }
      email = mail
    } catch {
      // No usar auth/invalid-login-credentials: en UI se confunde con “mal password”.
      // Aquí el cliente ya autenticó; falló verifyIdToken (proyecto distinto, emulador vs prod, etc.).
      return NextResponse.json(
        { error: UNAUTHORIZED, code: 'api/token-id-no-verificado' },
        { status: 401 },
      )
    }

    try {
      await createSessionCookieFromIdToken(idToken)
      await clearLoginFailures(email, ip)
    } catch (error) {
      console.error('POST /api/auth/session cookie', error)
      return NextResponse.json({ error: UNAUTHORIZED, code: 'api/sesion-servidor' }, { status: 401 })
    }

    return NextResponse.json({ exito: true })
  } catch (error) {
    console.error('POST /api/auth/session', error)
    return NextResponse.json({ error: UNAUTHORIZED, code: 'api/sesion-servidor' }, { status: 401 })
  }
}

export async function DELETE() {
  try {
    await closeServerSession()
    return NextResponse.json({ exito: true })
  } catch (error) {
    console.error('DELETE /api/auth/session', error)
    return NextResponse.json({ error: UNAUTHORIZED }, { status: 401 })
  }
}
