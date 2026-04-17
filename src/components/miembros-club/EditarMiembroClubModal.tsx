'use client'

import { useEffect, useId, useState, type FormEvent } from 'react'
import { TextField } from '@/components/ui/TextField'
import { esRutChilenoFormatoValido } from '@/lib/validation/chileRut'
import type { MiembroClubCliente } from '@/types/miembro-club.types'

export interface EditarMiembroClubModalProps {
  miembro: MiembroClubCliente | null
  onClose: () => void
  onGuardado?: (m: MiembroClubCliente) => void
}

export function EditarMiembroClubModal({
  miembro,
  onClose,
  onGuardado,
}: EditarMiembroClubModalProps) {
  const baseId = useId()
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [rut, setRut] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (miembro) {
      setNombre(miembro.nombre)
      setApellidos(miembro.apellidos)
      setRut(miembro.rutFormateado)
      setError(null)
    }
  }, [miembro])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!miembro) {
      return
    }
    setError(null)
    if (!esRutChilenoFormatoValido(rut)) {
      setError('Ingrese un RUT con formato válido (7 u 8 dígitos y DV 0-9 o K).')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/miembros-club/${encodeURIComponent(miembro.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nombre, apellidos, rut }),
      })
      const data = (await res.json().catch(() => null)) as {
        error?: string
        miembro?: MiembroClubCliente | null
      } | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo actualizar')
        return
      }
      if (data?.miembro) {
        onGuardado?.(data.miembro)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!miembro) {
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
          Editar miembro
        </h2>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
          <TextField
            fieldId={`${baseId}-nombre`}
            label="Nombres"
            value={nombre}
            onChange={(ev) => setNombre(ev.target.value)}
            required
            maxLength={100}
            className="font-normal"
          />
          <TextField
            fieldId={`${baseId}-apellidos`}
            label="Apellidos"
            value={apellidos}
            onChange={(ev) => setApellidos(ev.target.value)}
            required
            maxLength={120}
            className="font-normal"
          />
          <TextField
            fieldId={`${baseId}-rut`}
            label="RUT"
            value={rut}
            onChange={(ev) => setRut(ev.target.value)}
            required
            maxLength={20}
            className="font-normal"
          />
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
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
