// Sign-in form: email, password, link to forgot password.

'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { ROUTES } from '@/constants'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import {
  formatErrorForDebug,
  hintDiagnosticoAuth,
  mapAuthError,
} from '@/lib/errors/authErrorMap'
import { redirectToDashboard, signInWithServerSession } from '@/services/auth.service'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isTemporarilyBlocked, setIsTemporarilyBlocked] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage('')
    setIsTemporarilyBlocked(false)
    setLoading(true)
    try {
      await signInWithServerSession(email, password)
      redirectToDashboard()
    } catch (error) {
      const mapped = mapAuthError(error)
      console.error('[sign-in]', mapped.codigo, error)
      if (process.env.NODE_ENV === 'development') {
        const hint = hintDiagnosticoAuth(mapped.codigo)
        if (hint) {
          console.warn('[sign-in] diagnóstico (solo dev)', hint)
        }
      }
      setIsTemporarilyBlocked(
        mapped.codigo === 'auth/too-many-requests' || mapped.codigo === 'api/login-bloqueado',
      )
      const isUnknown = mapped.codigo === 'desconocido'
      const devExtra =
        process.env.NODE_ENV === 'development' && isUnknown
          ? ` (${formatErrorForDebug(error)})`
          : ''
      setErrorMessage(`${mapped.mensaje}${devExtra}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4 font-bold">
      <TextField
        fieldId="email"
        label="Correo electrónico"
        type="email"
        autoComplete="email"
        className="font-normal"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1">
        <TextField
          fieldId="password"
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          className="font-normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
          />
          Mostrar contraseña
        </label>
      </div>
      <ErrorMessage message={errorMessage} />
      {isTemporarilyBlocked ? (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800" role="status">
          Tu acceso fue bloqueado temporalmente por intentos fallidos. Si deseas recuperar tu
          contraseña, usa la opción "¿Olvidaste tu contraseña?".
        </p>
      ) : null}
      <Button
        buttonType="submit"
        label="Ingresar"
        loading={loading}
        loadingLabel="Validando acceso..."
        disabled={loading}
        className="bg-blue-800 font-bold hover:bg-blue-900"
      />
      <Link
        href={ROUTES.forgotPassword}
        className="text-center text-sm font-semibold text-blue-700 underline hover:text-blue-800"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </form>
  )
}
