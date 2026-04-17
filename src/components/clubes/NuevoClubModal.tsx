// Modal: alta de club vía POST /api/clubes; estado de éxito con check.

'use client'

import { useId, useState, type FormEvent } from 'react'
import { TextField } from '@/components/ui/TextField'
import { IconCheckCircle } from '@/components/layout/icons/NavIcons'
import type { ClubCliente } from '@/types/club.types'

export interface NuevoClubModalProps {
  open: boolean
  onClose: () => void
  /** Si se creó un club, el padre puede actualizar la lista. */
  onCreado?: (club: ClubCliente) => void
}

export function NuevoClubModal({ open, onClose, onCreado }: NuevoClubModalProps) {
  const baseId = useId()
  const [nombre, setNombre] = useState('')
  const [comuna, setComuna] = useState('')
  const [region, setRegion] = useState('')
  const [activo, setActivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  function cerrarTodo() {
    setNombre('')
    setComuna('')
    setRegion('')
    setActivo(true)
    setError(null)
    setExito(false)
    onClose()
  }

  function cerrarTrasExito() {
    setNombre('')
    setComuna('')
    setRegion('')
    setActivo(true)
    setError(null)
    setExito(false)
    onClose()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/clubes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, comuna, region, activo }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: string; club?: ClubCliente }
        | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo crear el club')
        return
      }
      if (data?.club) {
        onCreado?.(data.club)
      }
      setExito(true)
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseId}-titulo`}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget && !exito) {
          cerrarTodo()
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        {exito ? (
          <div className="flex flex-col items-center text-center">
            <span
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600"
              aria-hidden
            >
              <IconCheckCircle className="h-10 w-10" />
            </span>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-slate-900">
              ¡Club agregado exitosamente!
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              El club ya está disponible en el listado.
            </p>
            <button
              type="button"
              onClick={() => cerrarTrasExito()}
              className="mt-8 w-full rounded-lg bg-blue-800 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-blue-900">
              Nuevo club
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete los datos del club. Podrá editarlos después desde esta misma pantalla (Gestión de
              clubes).
            </p>

            <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
              <div>
                <TextField
                  fieldId={`${baseId}-nombre`}
                  label="Nombre del club"
                  value={nombre}
                  onChange={(ev) => setNombre(ev.target.value)}
                  required
                  maxLength={196}
                  placeholder="Ej. El trigal"
                  autoComplete="organization"
                  className="font-normal"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Se guardará con el prefijo <strong className="text-slate-700">CAM</strong> (por ejemplo:{' '}
                  <span className="font-medium text-slate-700">CAM El trigal</span>).
                </p>
              </div>
              <TextField
                fieldId={`${baseId}-comuna`}
                label="Comuna"
                value={comuna}
                onChange={(ev) => setComuna(ev.target.value)}
                required
                maxLength={120}
                autoComplete="address-level2"
                className="font-normal"
              />
              <TextField
                fieldId={`${baseId}-region`}
                label="Región"
                value={region}
                onChange={(ev) => setRegion(ev.target.value)}
                required
                maxLength={120}
                autoComplete="address-level1"
                className="font-normal"
              />
              <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(ev) => setActivo(ev.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-800 focus:ring-blue-800"
                />
                <span className="text-sm font-medium text-slate-800">Club activo</span>
              </label>

              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => cerrarTodo()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50"
                >
                  {loading ? 'Guardando…' : 'Guardar club'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
