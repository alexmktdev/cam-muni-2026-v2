// Client helpers: Firebase password login en navegador + cookie httpOnly vía servidor.

import { ROUTES } from '@/constants'
import {
  getIdTokenAfterPasswordLogin,
  signOutClient,
  sendPasswordResetToEmail,
} from '@/lib/firebase/clientFirebase'

export async function signInWithServerSession(email: string, password: string): Promise<void> {
  const idToken = await getIdTokenAfterPasswordLogin(email, password)

  let response: Response
  try {
    response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    })
  } catch (cause) {
    await signOutClient().catch(() => {})
    const err = new Error('Fallo de red al crear la sesión') as Error & { code: string }
    err.code = 'api/red-cliente'
    err.cause = cause
    throw err
  }

  if (!response.ok) {
    await signOutClient().catch(() => {})
    const payload = (await response.json().catch(() => null)) as { code?: string } | null
    const err = new Error('No se pudo crear la sesión') as Error & { code: string }
    if (payload?.code) {
      err.code = payload.code
    } else if (response.status === 404) {
      err.code = 'api/no-encontrado'
    } else if (response.status === 429) {
      err.code = 'api/login-bloqueado'
    } else if (response.status === 401) {
      err.code = payload?.code ?? 'api/sesion-servidor'
    } else {
      err.code = 'api/error-servidor'
    }
    throw err
  }

  await signOutClient().catch(() => {})
}

export async function signOutFully(): Promise<void> {
  await fetch('/api/auth/session', { method: 'DELETE' })
  await signOutClient()
}

export async function requestPasswordReset(email: string): Promise<void> {
  await sendPasswordResetToEmail(email)
}

export function redirectToDashboard(): void {
  window.location.href = ROUTES.dashboard
}

export function redirectToLogin(): void {
  window.location.href = ROUTES.login
}
