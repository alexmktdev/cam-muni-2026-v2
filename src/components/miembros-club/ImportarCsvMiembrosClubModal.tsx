'use client'

import { useId, useState, type FormEvent } from 'react'
import { IconCheckCircle } from '@/components/layout/icons/NavIcons'

export type ResultadoImportCsvClub = {
  agregados: number
  omitidosDuplicado: number
  filasConError: number
  errores: string[]
}

export interface ImportarCsvMiembrosClubModalProps {
  open: boolean
  clubId: string
  onClose: () => void
  onImportado?: () => void
}

export function ImportarCsvMiembrosClubModal({
  open,
  clubId,
  onClose,
  onImportado,
}: ImportarCsvMiembrosClubModalProps) {
  const baseId = useId()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportCsvClub | null>(null)

  function reset() {
    setArchivo(null)
    setError(null)
    setResultado(null)
  }

  function cerrar() {
    reset()
    onClose()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setResultado(null)
    if (!archivo) {
      setError('Seleccione un archivo CSV.')
      return
    }
    if (!clubId) {
      setError('Seleccione un club antes de importar.')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set('clubId', clubId)
      fd.set('archivo', archivo)
      const res = await fetch('/api/miembros-club/csv', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const data = (await res.json().catch(() => null)) as
        | (ResultadoImportCsvClub & { error?: string })
        | null
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo importar')
        return
      }
      if (
        data &&
        typeof data.agregados === 'number' &&
        typeof data.omitidosDuplicado === 'number' &&
        typeof data.filasConError === 'number'
      ) {
        setResultado({
          agregados: data.agregados,
          omitidosDuplicado: data.omitidosDuplicado,
          filasConError: data.filasConError,
          errores: Array.isArray(data.errores) ? data.errores : [],
        })
        onImportado?.()
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
        if (!loading && ev.target === ev.currentTarget && !resultado) {
          cerrar()
        }
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl sm:max-w-xl sm:p-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        {resultado ? (
          <div>
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <IconCheckCircle className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-slate-900">
                  Importación terminada
                </h2>
                <ul className="mt-3 space-y-1 text-sm text-slate-600">
                  <li>
                    Nuevos miembros:{' '}
                    <strong className="text-green-800">{resultado.agregados}</strong>
                  </li>
                  <li>
                    Omitidos (RUT ya existía en el club):{' '}
                    <strong>{resultado.omitidosDuplicado}</strong>
                  </li>
                  <li>
                    Filas con error: <strong>{resultado.filasConError}</strong>
                  </li>
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  El número de fila (<strong>#</strong>) en la tabla se asigna solo en el sistema según el
                  orden de la lista. En CSV se comprueba el formato del RUT (no el módulo 11), para no rechazar
                  planillas del Registro Civil.
                </p>
                {resultado.errores.length > 0 ? (
                  <div className="mt-4 max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                    <p className="font-bold">Detalle (primeros avisos)</p>
                    <ul className="mt-1 list-inside list-disc space-y-0.5">
                      {resultado.errores.slice(0, 25).map((err) => (
                        <li key={err}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => cerrar()}
              className="mt-8 w-full rounded-lg bg-blue-800 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <>
            <h2 id={`${baseId}-titulo`} className="text-lg font-bold text-blue-900">
              Importar miembros (CSV — un club)
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Solo <strong>dos columnas</strong>: <strong>Nombre completo</strong> (toda la persona en una
              celda) y <strong>RUT</strong> (o RUN). El sistema separa la primera palabra como nombre y el
              resto como apellidos. No use columna de apellidos aparte ni #.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Ejemplo de encabezados: <code className="rounded bg-slate-100 px-1 text-xs">Nombre completo,RUT</code>.
              CSV con comas, punto y coma o tabuladores. Los registros se cargan al club seleccionado arriba.
            </p>
            <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-4">
              <div>
                <label htmlFor={`${baseId}-file`} className="text-sm font-medium text-slate-700">
                  Archivo CSV
                </label>
                <input
                  id={`${baseId}-file`}
                  type="file"
                  accept=".csv,text/csv"
                  className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-800 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-900"
                  onChange={(ev) => setArchivo(ev.target.files?.[0] ?? null)}
                />
              </div>
              {error ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => cerrar()}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-50"
                >
                  {loading ? 'Importando…' : 'Importar'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
