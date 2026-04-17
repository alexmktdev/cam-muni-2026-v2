// GET: borra la cookie de sesión y redirige (solo Route Handler: Next.js no permite mutar cookies en layouts).

import { NextResponse } from 'next/server'
import { NOMBRE_COOKIE_SESION, ROUTES } from '@/constants'

function rutaInternaSegura(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return ROUTES.login
  }
  return path
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const nextParam = url.searchParams.get('next') ?? ROUTES.login
  const destino = rutaInternaSegura(nextParam)
  const redirectUrl = new URL(destino, url.origin)

  const res = NextResponse.redirect(redirectUrl)
  const isProd = process.env.NODE_ENV === 'production'
  res.cookies.set(NOMBRE_COOKIE_SESION, '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  return res
}
