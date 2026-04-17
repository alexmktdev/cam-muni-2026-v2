// Barra lateral: en móvil drawer; en lg+ fija. Cierra al navegar si onNavigate.

'use client'

import Image from 'next/image'
import { MARCA_APP } from '@/constants'
import { AppSidebarNav } from '@/components/layout/AppSidebarNav'
import { SignOutIconButton } from '@/components/layout/SignOutIconButton'
import logoMolina from '../../../logo-molina.png'

export interface AppSidebarProps {
  id?: string
  nombreUsuario: string
  inicialesUsuario: string
  rolUsuario?: string
  /** En viewport &lt; lg, controla si el drawer está visible. */
  mobileOpen?: boolean
  /** Tras elegir un ítem del menú (móvil). */
  onNavigate?: () => void
}

export function AppSidebar({
  id,
  nombreUsuario,
  inicialesUsuario,
  rolUsuario,
  mobileOpen = false,
  onNavigate,
}: AppSidebarProps) {
  return (
    <aside
      id={id}
      className={`fixed left-0 top-0 z-50 flex h-dvh w-[min(18rem,100vw-2.5rem)] max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-out lg:z-40 lg:w-72 lg:max-w-none lg:translate-x-0 ${
        mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}
    >
      <div className="shrink-0 border-b border-slate-200 px-3 pb-3 pt-5 sm:px-4 sm:pb-4 sm:pt-6">
        <Image
          src={logoMolina}
          alt={`Logo ${MARCA_APP}`}
          priority
          className="h-auto w-full max-w-[11.25rem] sm:max-w-[12.5rem]"
        />
      </div>

      <AppSidebarNav onItemClick={onNavigate} />

      <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 p-3 sm:p-4">
        <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm sm:p-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-800 text-xs font-bold text-white sm:h-11 sm:w-11 sm:text-sm"
              aria-hidden
            >
              {inicialesUsuario}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-xs font-bold leading-snug text-slate-800 sm:text-sm">
                {nombreUsuario}
              </p>
              {rolUsuario ? (
                <p className="mt-0.5 truncate text-[0.6875rem] font-medium text-slate-500 sm:text-xs">
                  {rolUsuario}
                </p>
              ) : null}
            </div>
            <SignOutIconButton />
          </div>
        </div>
      </div>
    </aside>
  )
}
