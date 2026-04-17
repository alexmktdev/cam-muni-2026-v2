'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { TextField } from '@/components/ui/TextField'
import type { ClubCliente } from '@/types/club.types'

export interface EditarClubModalProps {
  club: ClubCliente | null
  onClose: () => void
  onGuardado?: (club: ClubCliente) => void
}

export function EditarClubModal({ club, onClose, onGuardado }: EditarClubModalProps) {
  const baseId = useId()
  const [nombre, setNombre] = useState('')
  const [comuna, setComuna] = useState('')
  const [region, setRegion] = useState('')
  const [activo, setActivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (club) {
      setNombre(club.nombre)
      setComuna(club.comuna)
      setRegion(club.region)
      setActivo(club.activo)
      setError(null)
    }
  }, [club])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!club) {
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/clubes/${encodeURIComponent(club.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, comuna, region, activo }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: string; club?: ClubCliente }
        | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo actualizar el club')
        return
      }
      if (data?.club) {
        onGuardado?.(data.club)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!club) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseId}-titulo`}
      onClick={(ev) => {
        if (!loading && ev.target === ev.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-blue-900">
          Editar club
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Los cambios se guardan en Firestore. Si cambia el nombre, el enlace{' '}
          <span className="font-medium text-slate-700">?club=</span> puede variar al recargar el listado.
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
              autoComplete="organization"
              className="font-normal"
            />
            <p className="mt-1 text-xs text-slate-500">
              Convención <strong className="text-slate-700">CAM</strong>: si no incluye el prefijo, se añade al
              guardar (igual que al crear un club).
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
              onClick={() => onClose()}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50"
            >
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
