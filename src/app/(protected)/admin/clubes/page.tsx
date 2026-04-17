// Gestión de clubes: datos desde Firestore (servidor); alta y baja vía API.

import { AdminClubesShell } from '@/components/clubes/AdminClubesShell'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { readVerifiedSession } from '@/lib/session/readSession'
import { getUserProfileForSidebar } from '@/services/user.service'
import { obtenerResumenPanelAdmin } from '@/services/panel-resumen.service'

export default async function AdminClubesPage() {
  const session = await readVerifiedSession()
  if (!session) {
    return null
  }

  const perfil = await getUserProfileForSidebar(session.uid, session.email)
  const puedeGestionar = canManageUsers(perfil?.role)
  const panel = await obtenerResumenPanelAdmin()

  return (
    <AdminClubesShell
      initialTotales={{
        totalClubes: panel.totalClubes,
        totalClubesActivos: panel.totalClubesActivos,
        totalMiembros: panel.totalMiembros,
      }}
      puedeGestionar={puedeGestionar}
    />
  )
}
