// Public sign-in page.

import Image from 'next/image'
import { LoginForm } from '@/components/forms/LoginForm'
import logoMolina from '../../../../logo-molina.png'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 sm:px-12 sm:py-10 shadow-sm">
        <div className="mb-5 text-center">
          <Image
            src={logoMolina}
            alt="Logo institucional"
            priority
            className="mx-auto mb-5 h-auto w-72 sm:w-80"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Acceso al sistema</h1>
          <p className="mt-2 text-sm sm:text-base font-bold uppercase tracking-wider text-black">
            Registro Casa del Adulto mayor
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 border-t border-slate-100 pt-5 text-center text-xs font-bold uppercase tracking-wider text-slate-400">
          Sistema exclusivo para personal autorizado
          <br className="mb-1 block" />
          © 2026 Casa del Adulto Mayor
        </p>
      </div>
    </main>
  )
}
