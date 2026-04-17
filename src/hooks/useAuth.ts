// Lightweight hook: asks GET /api/auth/verify whether the session cookie is valid.

'use client'

import { useCallback, useEffect, useState } from 'react'

type AuthStatus = {
  loading: boolean
  hasSession: boolean | null
  refresh: () => Promise<void>
}

export function useAuth(): AuthStatus {
  const [loading, setLoading] = useState(true)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include',
      })
      setHasSession(response.ok)
    } catch {
      setHasSession(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { loading, hasSession, refresh }
}
