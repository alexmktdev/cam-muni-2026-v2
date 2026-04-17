// Request password reset email (generic success copy for security).

'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { ROUTES } from '@/constants'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { mapAuthError } from '@/lib/errors/authErrorMap'
import { requestPasswordReset } from '@/services/auth.service'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSuccessMessage('Correo de recuperación enviado con éxito')
    } catch (error) {
      setErrorMessage(mapAuthError(error).mensaje)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-4">
      <TextField
        fieldId="email-recovery"
        label="Ingrese su email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {successMessage ? (
        <p
          className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
          role="status"
        >
          <span aria-hidden="true">✅</span>
          {successMessage}
        </p>
      ) : null}
      <ErrorMessage message={errorMessage} />
      <Button
        buttonType="submit"
        label="Enviar enlace de recuperación"
        loading={loading}
        disabled={loading}
        className="bg-blue-800 text-sm font-bold hover:bg-blue-900"
      />
      <Link
        href={ROUTES.login}
        className="text-center text-sm font-bold text-slate-700 hover:text-slate-900"
      >
        Cancelar y volver
      </Link>
    </form>
  )
}
