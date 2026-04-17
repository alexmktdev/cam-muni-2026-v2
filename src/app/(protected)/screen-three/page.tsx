// Alta de usuario: formulario en tarjeta; creación vía API (rol admin por defecto).

import { NuevoUsuarioForm } from '@/components/usuarios/NuevoUsuarioForm'
import { AppMainSection } from '@/components/layout/AppMainSection'
import { TEXTO_SUBTITULO_NUEVO_USUARIO } from '@/constants'
import { canManageUsers } from '@/lib/auth/canManageUsers'
import { readVerifiedSession } from '@/lib/session/readSession'
import { getUserProfileForSidebar } from '@/services/user.service'

export default async function ScreenThreePage() {
  const session = await readVerifiedSession()
  if (!session) {
    return null
  }
  const perfil = await getUserProfileForSidebar(session.uid, session.email)
  const puedeCrear = canManageUsers(perfil?.role)

  return (
    <AppMainSection
      showHeader={false}
      title="Nuevo Usuario"
      subtitle={TEXTO_SUBTITULO_NUEVO_USUARIO}
    >
      <NuevoUsuarioForm puedeCrear={puedeCrear} />
    </AppMainSection>
  )
}
