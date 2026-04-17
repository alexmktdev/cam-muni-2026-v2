// Redirects based on session cookie presence (does not validate the token on the edge).

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { NOMBRE_COOKIE_SESION, ROUTES } from '@/constants'

function esRutaProtegida(ruta: string): boolean {
  if (ruta === ROUTES.dashboard || ruta.startsWith(`${ROUTES.dashboard}/`)) {
    return true
  }
  if (ruta === ROUTES.screenTwo || ruta.startsWith(`${ROUTES.screenTwo}/`)) {
    return true
  }
  if (ruta === ROUTES.screenThree || ruta.startsWith(`${ROUTES.screenThree}/`)) {
    return true
  }
  if (ruta === '/admin' || ruta.startsWith('/admin/')) {
    return true
  }
  return false
}

function esRutaAutenticacion(ruta: string): boolean {
  return (
    ruta === ROUTES.login ||
    ruta.startsWith(`${ROUTES.login}/`) ||
    ruta === ROUTES.forgotPassword ||
    ruta.startsWith(`${ROUTES.forgotPassword}/`)
  )
}

export function middleware(solicitud: NextRequest) {
  const cookieSesion = solicitud.cookies.get(NOMBRE_COOKIE_SESION)
  const tieneCookie = Boolean(cookieSesion?.value)
  const ruta = solicitud.nextUrl.pathname

  if (esRutaProtegida(ruta) && !tieneCookie) {
    return NextResponse.redirect(new URL(ROUTES.login, solicitud.url))
  }
  if (esRutaAutenticacion(ruta) && tieneCookie) {
    return NextResponse.redirect(new URL(ROUTES.dashboard, solicitud.url))
  }
  return NextResponse.next()
}

/**
 * Route groups (public) / (protected) do not appear in the URL.
 * We match the real paths that should be handled quickly on the edge.
 */
export const config = {
  matcher: [
    '/login',
    '/login/:path*',
    '/forgot-password',
    '/forgot-password/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/screen-two',
    '/screen-two/:path*',
    '/screen-three',
    '/screen-three/:path*',
    '/admin',
    '/admin/:path*',
  ],
}
