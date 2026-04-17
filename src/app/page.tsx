// Página de inicio: envía al flujo de sesión (login) de forma explícita.

import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants'

export default function PaginaInicio() {
  redirect(ROUTES.login)
}
