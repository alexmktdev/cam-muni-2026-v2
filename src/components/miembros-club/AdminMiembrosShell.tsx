'use client'

import { TEXTO_SUBTITULO_ADMIN_MIEMBROS_CLUBES } from '@/constants'
import { AppMainSection } from '@/components/layout/AppMainSection'
import { IconUsersTwo } from '@/components/layout/icons/NavIcons'
import { MiembrosClubView } from '@/components/miembros-club/MiembrosClubView'
export interface AdminMiembrosShellProps {
  puedeGestionar: boolean
}

export function AdminMiembrosShell({
  puedeGestionar,
}: AdminMiembrosShellProps) {
  return (
    <AppMainSection
      title="Gestión de miembros de clubes"
      subtitle={TEXTO_SUBTITULO_ADMIN_MIEMBROS_CLUBES}
      TitleIcon={IconUsersTwo}
    >
      <MiembrosClubView
        puedeGestionar={puedeGestionar}
      />
    </AppMainSection>
  )
}
