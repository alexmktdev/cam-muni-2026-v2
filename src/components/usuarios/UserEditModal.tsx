// Modal editar usuario: envía PATCH /api/users/[uid] con Zod validado en servidor.

'use client'

import { useEffect, useId, useState } from 'react'
import type { UsuarioListaCliente } from '@/types/user.types'

export interface UserEditModalProps {
  user: UsuarioListaCliente | null
  miUsuarioId: string
  onClose: () => void
  onGuardado: (actualizado: UsuarioListaCliente) => void
}

export function UserEditModal({ user, miUsuarioId, onClose, onGuardado }: UserEditModalProps) {
  const baseId = useId()
  const [name, setName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [active, setActive] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esMiUsuario = user?.id === miUsuarioId

  useEffect(() => {
    if (!user) {
      return
    }
    setName(user.name || '')
    setLastName(user.lastName || '')
    setEmail(user.email === '—' ? '' : user.email)
    setRole(user.role || '')
    setActive(user.active)
    setError(null)
  }, [user])

  if (!user) {
    return null
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const u = user
    if (!u) {
      return
    }
    setError(null)
    if (!name.trim() || !lastName.trim() || !email.trim() || !role.trim()) {
      setError('Complete nombre, apellido, correo y rol.')
      return
    }
    if (esMiUsuario && !active) {
      setError('No puede desactivar su propia cuenta desde aquí.')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(u.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          role: role.trim(),
          active,
        }),
        credentials: 'include',
      })
      const data = (await res.json().catch(() => null)) as { error?: string } | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo guardar')
        return
      }
      const nombre = `${name.trim()} ${lastName.trim()}`.trim()
      const partes = nombre.split(/\s+/).filter(Boolean)
      let iniciales = '—'
      if (partes.length >= 2) {
        iniciales = `${partes[0]![0] ?? ''}${partes[1]![0] ?? ''}`.toUpperCase()
      } else if (partes.length === 1 && partes[0]!.length >= 2) {
        iniciales = partes[0]!.slice(0, 2).toUpperCase()
      }
      const actualizado: UsuarioListaCliente = {
        id: u.id,
        nombre,
        iniciales,
        email: email.trim().toLowerCase(),
        role: role.trim(),
        active,
        fechaCreacion: u.fechaCreacion,
        name: name.trim(),
        lastName: lastName.trim(),
      }
      onGuardado(actualizado)
      onClose()
    } finally {
      setGuardando(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-800 focus:ring-1 focus:ring-blue-800'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseId}-titulo`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-slate-900">
          Editar usuario
        </h2>
        <p className="mt-1 text-sm text-slate-500">Modifique los datos y guarde los cambios.</p>

        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor={`${baseId}-name`} className="mb-1 block text-sm font-semibold text-slate-700">
                Nombre
              </label>
              <input
                id={`${baseId}-name`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                required
                autoComplete="given-name"
              />
            </div>
            <div>
              <label
                htmlFor={`${baseId}-last`}
                className="mb-1 block text-sm font-semibold text-slate-700"
              >
                Apellido
              </label>
              <input
                id={`${baseId}-last`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label htmlFor={`${baseId}-email`} className="mb-1 block text-sm font-semibold text-slate-700">
              Correo
            </label>
            <input
              id={`${baseId}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor={`${baseId}-role`} className="mb-1 block text-sm font-semibold text-slate-700">
              Rol
            </label>
            <input
              id={`${baseId}-role`}
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={active}
              disabled={esMiUsuario}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-800"
            />
            Usuario activo
            {esMiUsuario ? (
              <span className="text-xs font-normal text-slate-500">(no puede desactivarse a sí mismo)</span>
            ) : null}
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-900 disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
