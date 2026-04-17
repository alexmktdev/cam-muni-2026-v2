// Cabecera del área principal (título + subtítulo + ícono).

import type { ComponentType, ReactNode } from 'react'
import { IconGridFour } from '@/components/layout/icons/NavIcons'

export interface AppMainHeaderProps {
  title: string
  subtitle: string
  TitleIcon?: ComponentType<{ className?: string }>
  /** Botones u otras acciones a la derecha (p. ej. “Nuevo usuario”). */
  actions?: ReactNode
}

export function AppMainHeader({
  title,
  subtitle,
  TitleIcon = IconGridFour,
  actions,
}: AppMainHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-2.5 sm:gap-3">
          <TitleIcon className="mt-0.5 h-7 w-7 shrink-0 text-blue-900 sm:mt-1 sm:h-8 sm:w-8" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-blue-900 sm:text-2xl">{title}</h1>
            <p className="mt-1 text-sm font-normal leading-snug text-slate-500">{subtitle}</p>
          </div>
        </div>
        {actions ? <div className="w-full shrink-0 sm:w-auto">{actions}</div> : null}
      </div>
    </header>
  )
}
