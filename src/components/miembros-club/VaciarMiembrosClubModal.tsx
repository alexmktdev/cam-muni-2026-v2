'use client'

import { useId, useState, type FormEvent } from 'react'
import { CONFIRMACION_VACIAR_MIEMBROS_CLUB } from '@/constants'

export interface VaciarMiembrosClubModalProps {
  open: boolean
  clubId: string
  nombreClub: string
  onClose: () => void
  onVaciado?: () => void
}

export function VaciarMiembrosClubModal({
  open,
  clubId,
  nombreClub,
  onClose,
  onVaciado,
}: VaciarMiembrosClubModalProps) {
  const baseId = useId()
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<number | null>(null)

  const coincide = texto.trim() === CONFIRMACION_VACIAR_MIEMBROS_CLUB

  function reset() {
    setTexto('')
    setError(null)
    setHecho(null)
  }

  function cerrar() {
    reset()
    onClose()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!coincide || !clubId) {
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/miembros-club/vaciar-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          clubId,
          confirmacion: CONFIRMACION_VACIAR_MIEMBROS_CLUB,
        }),
      })
      const data = (await res.json().catch(() => null)) as
        | { documentosEliminados?: number; error?: string }
        | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo eliminar los miembros')
        return
      }
      if (typeof data?.documentosEliminados === 'number') {
        setHecho(data.documentosEliminados)
        onVaciado?.()
      }
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
      onClick={(ev) => {
        if (!loading && ev.target === ev.currentTarget && hecho === null) {
          cerrar()
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {hecho !== null ? (
          <>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-slate-900">
              Miembros eliminados
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Se borraron <strong>{hecho}</strong> registro(s) de miembros en{' '}
              <strong>{nombreClub}</strong>. El contador del club quedó en 0.
            </p>
            <button
              type="button"
              onClick={() => cerrar()}
              className="mt-6 w-full rounded-lg bg-slate-800 py-2.5 text-sm font-bold text-white"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-red-800">
              Eliminar todos los miembros de este club
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Club: <strong className="text-slate-900">{nombreClub}</strong>
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Se eliminarán todos los miembros de <strong>este</strong> club únicamente. No se borran otros
              clubes ni sus miembros. Esta acción no se puede deshacer.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Escriba exactamente:{' '}
              <code className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-xs text-red-900">
                {CONFIRMACION_VACIAR_MIEMBROS_CLUB}
              </code>
            </p>
            <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
              <input
                id={`${baseId}-confirm`}
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600"
                placeholder={CONFIRMACION_VACIAR_MIEMBROS_CLUB}
                aria-label="Confirmación por texto"
              />
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => cerrar()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !coincide}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Eliminando…' : 'Eliminar todos los miembros del club'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
