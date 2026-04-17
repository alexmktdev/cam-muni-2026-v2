// Formulario de alta de usuario (presentación); creación vía POST /api/users.

'use client'

import Link from 'next/link'
import { useCallback, useId, useState, type ReactNode } from 'react'
import { ROUTES, TEXTO_SUBTITULO_NUEVO_USUARIO } from '@/constants'
import {
  IconArrowLeft,
  IconCheckCircle,
  IconMail,
  IconUser,
  IconUserPlus,
} from '@/components/layout/icons/NavIcons'

function AsteriscoReq() {
  return (
    <span className="ml-0.5 text-blue-800" aria-hidden>
      *
    </span>
  )
}

export interface NuevoUsuarioFormProps {
  puedeCrear: boolean
}

/** Centra la tarjeta en el área principal y limita el ancho en pantallas grandes. */
function ContenedorFormulario({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col justify-center px-2 sm:min-h-[calc(100dvh-9rem)] sm:px-4 sm:py-10">
      {children}
    </div>
  )
}

export function NuevoUsuarioForm({ puedeCrear }: NuevoUsuarioFormProps) {
  const baseId = useId()
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  const reiniciar = useCallback(() => {
    setNombre('')
    setApellido('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setError(null)
    setExito(false)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setEnviando(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          password,
          confirmPassword,
        }),
        credentials: 'include',
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo crear el usuario')
        return
      }
      setExito(true)
    } finally {
      setEnviando(false)
    }
  }

  if (!puedeCrear) {
    return (
      <ContenedorFormulario>
        <div className="w-full rounded-xl border border-slate-200 bg-white p-8 shadow-md sm:p-10 lg:p-12">
          <p className="text-center text-base text-slate-600">
            No tiene permisos para crear usuarios. Si necesita acceso, contacte a un administrador.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={ROUTES.screenTwo}
              className="text-sm font-semibold text-blue-800 underline-offset-2 hover:underline"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </ContenedorFormulario>
    )
  }

  if (exito) {
    return (
      <ContenedorFormulario>
        <div className="w-full rounded-xl border border-slate-200 bg-white p-10 shadow-md sm:p-12 lg:p-14">
          <div className="flex flex-col items-center text-center">
            <div
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600"
              aria-hidden
            >
              <IconCheckCircle className="h-14 w-14" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Usuario creado</h2>
            <p className="mt-3 max-w-lg text-base text-slate-600">
              El nuevo usuario puede iniciar sesión con el correo y la contraseña indicados.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={reiniciar}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Crear otro usuario
              </button>
              <Link
                href={ROUTES.screenTwo}
                className="rounded-lg bg-blue-800 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-900"
              >
                Ir al listado
              </Link>
            </div>
          </div>
        </div>
      </ContenedorFormulario>
    )
  }

  const idNombre = `${baseId}-nombre`
  const idApellido = `${baseId}-apellido`
  const idEmail = `${baseId}-email`
  const idPass = `${baseId}-pass`
  const idConfirm = `${baseId}-confirm`

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-800 focus:ring-1 focus:ring-blue-800'

  const sectionIconBox =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-900'

  return (
    <ContenedorFormulario>
      <div className="w-full rounded-xl border border-slate-200 bg-white p-7 shadow-md sm:p-10 lg:p-12">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start">
          <Link
            href={ROUTES.screenTwo}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            aria-label="Volver al listado de usuarios"
          >
            <IconArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <IconUserPlus className="mt-1 h-10 w-10 shrink-0 text-blue-900" aria-hidden />
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Nuevo Usuario</h1>
              <p className="mt-2 text-base text-slate-500">{TEXTO_SUBTITULO_NUEVO_USUARIO}</p>
            </div>
          </div>
        </div>

        <form onSubmit={(e) => void onSubmit(e)} className="space-y-8" noValidate>
          <h2 className="text-lg font-bold text-slate-800">Información del usuario</h2>

          <section className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className={sectionIconBox}>
                <IconUser className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-800">Información Personal</h3>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor={idNombre} className="mb-2 block text-sm font-semibold text-slate-700">
                  Nombre
                  <AsteriscoReq />
                </label>
                <input
                  id={idNombre}
                  name="nombre"
                  required
                  autoComplete="given-name"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Juan"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor={idApellido} className="mb-2 block text-sm font-semibold text-slate-700">
                  Apellido
                  <AsteriscoReq />
                </label>
                <input
                  id={idApellido}
                  name="apellido"
                  required
                  autoComplete="family-name"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Ej: Pérez"
                  className={inputClass}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200/90 bg-slate-50 p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <span className={sectionIconBox}>
                <IconMail className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-800">Información de Cuenta</h3>
            </div>
            <div className="space-y-5">
              <div>
                <label htmlFor={idEmail} className="mb-2 block text-sm font-semibold text-slate-700">
                  Email
                  <AsteriscoReq />
                </label>
                <input
                  id={idEmail}
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@example.com"
                  className={inputClass}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor={idPass} className="mb-2 block text-sm font-semibold text-slate-700">
                    Contraseña
                    <AsteriscoReq />
                  </label>
                  <input
                    id={idPass}
                    name="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={idConfirm} className="mb-2 block text-sm font-semibold text-slate-700">
                    Confirmar Contraseña
                    <AsteriscoReq />
                  </label>
                  <input
                    id={idConfirm}
                    name="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetir contraseña"
                    minLength={6}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </section>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-8">
          <Link
            href={ROUTES.screenTwo}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-800 px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-60"
          >
            <IconUserPlus className="h-5 w-5" aria-hidden />
            {enviando ? 'Creando…' : 'Crear Usuario'}
          </button>
        </div>
      </form>
      </div>
    </ContenedorFormulario>
  )
}
