// Botón cerrar sesión con ícono (sidebar); lógica en auth.service existente.

'use client'

import { useState } from 'react'
import { IconLogOut } from '@/components/layout/icons/NavIcons'
import { redirectToLogin, signOutFully } from '@/services/auth.service'

export function SignOutIconButton() {
  const [loading, setLoading] = useState(false)

  async function onSignOut() {
    setLoading(true)
    try {
      await signOutFully()
      redirectToLogin()
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onSignOut()}
      disabled={loading}
      aria-label="Cerrar sesión"
      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
    >
      <IconLogOut className="h-5 w-5" />
    </button>
  )
}
