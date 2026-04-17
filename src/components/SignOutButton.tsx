// Client: calls server sign-out + Firebase signOut, then redirects to login.

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { redirectToLogin, signOutFully } from '@/services/auth.service'

export function SignOutButton() {
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
    <Button
      label="Cerrar sesión"
      onClick={() => void onSignOut()}
      loading={loading}
      disabled={loading}
    />
  )
}
