// Public forgot-password / reset email request page.

import Image from 'next/image'
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm'
import logoMolina from '../../../../logo-molina.png'

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <Image
          src={logoMolina}
          alt="Logo institucional"
          priority
          className="mx-auto mb-4 h-auto w-44"
        />
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">
          Recuperar Acceso
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Enviaremos un enlace a su correo registrado en la plataforma
        </p>
        <ForgotPasswordForm />
      </div>
    </main>
  )
}
