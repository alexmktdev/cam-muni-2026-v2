'use client'

import { useId, useState, type FormEvent } from 'react'
import { CONFIRMACION_RESET_MIEMBROS_POST_IMPORT } from '@/constants'

export interface ResetMiembrosPostImportModalProps {
  open: boolean
  onClose: () => void
  onListo?: () => void
}

export function ResetMiembrosPostImportModal({
  open,
  onClose,
  onListo,
}: ResetMiembrosPostImportModalProps) {
  const baseId = useId()
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState<{ eliminados: number; clubes: number } | null>(null)

  const coincide = texto.trim() === CONFIRMACION_RESET_MIEMBROS_POST_IMPORT

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
    if (!coincide) {
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/miembros-club/reset-post-importacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ confirmacion: CONFIRMACION_RESET_MIEMBROS_POST_IMPORT }),
      })
      const data = (await res.json().catch(() => null)) as
        | { documentosEliminados?: number; clubesConContadorReseteado?: number; error?: string }
        | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo ejecutar el reset')
        return
      }
      if (
        typeof data?.documentosEliminados === 'number' &&
        typeof data?.clubesConContadorReseteado === 'number'
      ) {
        setHecho({
          eliminados: data.documentosEliminados,
          clubes: data.clubesConContadorReseteado,
        })
        onListo?.()
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
        if (!loading && ev.target === ev.currentTarget && !hecho) {
          cerrar()
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-amber-300 bg-white p-6 shadow-xl"
        onClick={(ev) => ev.stopPropagation()}
      >
        {hecho ? (
          <>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-slate-900">
              Reset completado
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Se eliminaron <strong>{hecho.eliminados}</strong> registro(s) en miembros y el contador
              «Miembros» quedó en <strong>0</strong> en <strong>{hecho.clubes}</strong> club(es). El panel
              y la gestión de clubes mostrarán cero hasta que cargue datos en «Gestión de miembros».
            </p>
            <button
              type="button"
              onClick={() => cerrar()}
              className="mt-6 w-full rounded-lg bg-blue-800 py-2.5 text-sm font-bold text-white"
            >
              Cerrar
            </button>
          </>
        ) : (
          <>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-amber-950">
              Reset de miembros (post-migración)
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Use esto si importó clubes desde otro sistema y los números de miembros no aplican: se
              borran <strong>todos</strong> los documentos de la colección de miembros y cada club pasa a{' '}
              <strong>miembros: 0</strong>. Los clubes no se eliminan.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Escriba exactamente:{' '}
              <code className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-xs text-amber-950">
                {CONFIRMACION_RESET_MIEMBROS_POST_IMPORT}
              </code>
            </p>
            <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
              <input
                id={`${baseId}-confirm`}
                type="text"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                autoComplete="off"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                placeholder={CONFIRMACION_RESET_MIEMBROS_POST_IMPORT}
                aria-label="Confirmación por texto"
              />
              {error ? (
                <p className="text-sm text-red-700">{error}</p>
              ) : null}
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
                  className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? 'Ejecutando…' : 'Resetear miembros'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
