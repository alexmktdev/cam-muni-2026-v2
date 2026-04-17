// Verifies session on the server before rendering protected routes (in addition to middleware).

import { redirect } from 'next/navigation'
import { ROUTES } from '@/constants'
import { AppShellLayout } from '@/components/layout/AppShellLayout'
import { getSidebarProfileForSession } from '@/lib/auth/sidebarProfile'
import { readVerifiedSession } from '@/lib/session/readSession'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await readVerifiedSession()
  if (!session) {
    const next = encodeURIComponent(ROUTES.login)
    redirect(`/api/auth/clear-session-cookie?next=${next}`)
  }

  const perfil = await getSidebarProfileForSession(session.uid, session.email)

  return (
    <AppShellLayout
      nombreUsuario={perfil.nombre}
      inicialesUsuario={perfil.iniciales}
      rolUsuario={perfil.rol}
    >
      {children}
    </AppShellLayout>
  )
}
