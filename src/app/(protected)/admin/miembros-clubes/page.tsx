// Miembros por club: selector, tabla, alta, importación CSV y edición (API + Firestore).

import { AdminMiembrosShell } from '@/components/miembros-club/AdminMiembrosShell'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { readVerifiedSession } from '@/lib/session/readSession'
import { getUserProfileForSidebar } from '@/services/user.service'

export default async function AdminMiembrosClubesPage() {
  const session = await readVerifiedSession()
  if (!session) {
    return null
  }

  const perfil = await getUserProfileForSidebar(session.uid, session.email)
  const puedeGestionar = canManageUsers(perfil?.role)

  return (
    <AdminMiembrosShell
      puedeGestionar={puedeGestionar}
    />
  )
}
