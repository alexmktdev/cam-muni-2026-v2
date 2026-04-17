// Layout web: sidebar + columna principal (responsive; menú móvil en ResponsiveAppShell).

import type { ReactNode } from 'react'
import { ResponsiveAppShell } from '@/components/layout/ResponsiveAppShell'

export interface AppShellLayoutProps {
  children: ReactNode
  nombreUsuario: string
  inicialesUsuario: string
  rolUsuario?: string
}

export function AppShellLayout({
  children,
  nombreUsuario,
  inicialesUsuario,
  rolUsuario,
}: AppShellLayoutProps) {
  return (
    <ResponsiveAppShell
      nombreUsuario={nombreUsuario}
      inicialesUsuario={inicialesUsuario}
      rolUsuario={rolUsuario}
    >
      {children}
    </ResponsiveAppShell>
  )
}
