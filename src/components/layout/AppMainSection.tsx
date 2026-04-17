// Área principal: cabecera blanca + cuerpo en gris claro.

import type { ComponentType, ReactNode } from 'react'
import { AppMainHeader } from '@/components/layout/AppMainHeader'

export interface AppMainSectionProps {
  title: string
  subtitle: string
  /** Ícono junto al título (misma API que en NavIcons). */
  TitleIcon?: ComponentType<{ className?: string }>
  actions?: ReactNode
  children?: ReactNode
  /** Si es false, el contenido define su propia cabecera (p. ej. formulario en tarjeta). */
  showHeader?: boolean
}

export function AppMainSection({
  title,
  subtitle,
  TitleIcon,
  actions,
  children,
  showHeader = true,
}: AppMainSectionProps) {
  return (
    <main className="flex min-h-screen flex-col">
      {showHeader ? (
        <AppMainHeader title={title} subtitle={subtitle} TitleIcon={TitleIcon} actions={actions} />
      ) : null}
      <div className="min-h-0 flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">{children}</div>
    </main>
  )
}
