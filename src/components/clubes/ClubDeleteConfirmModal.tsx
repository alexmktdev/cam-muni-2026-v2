// Confirmación de eliminación de club.

'use client'

import { useId } from 'react'
import { IconTrash } from '@/components/layout/icons/NavIcons'
import type { ClubCliente } from '@/types/club.types'

export interface ClubDeleteConfirmModalProps {
  club: ClubCliente | null
  error: string | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ClubDeleteConfirmModal({
  club,
  error,
  loading,
  onClose,
  onConfirm,
}: ClubDeleteConfirmModalProps) {
  const baseId = useId()

  if (!club) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${baseId}-titulo`}
      onClick={(e) => {
        if (!loading && e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
            aria-hidden
          >
            <IconTrash className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-slate-900">
              Eliminar club
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              ¿Eliminar definitivamente <strong className="text-slate-800">{club.nombre}</strong> en{' '}
              {club.comuna}? Se borrará el documento en la colección de clubes. Esta acción no se
              puede deshacer.
            </p>
          </div>
        </div>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
