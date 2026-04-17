'use client'

import { useId, useState, type FormEvent } from 'react'
import { IconCheckCircle } from '@/components/layout/icons/NavIcons'
import type { ResultadoImportMasivo } from '@/services/importacion-masiva.service'

export interface ImportarCsvMasivoSistemaModalProps {
  open: boolean
  onClose: () => void
  onImportado?: () => void
}

export function ImportarCsvMasivoSistemaModal({
  open,
  onClose,
  onImportado,
}: ImportarCsvMasivoSistemaModalProps) {
  const baseId = useId()
  const [archivo, setArchivo] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<ResultadoImportMasivo | null>(null)

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
      setError('Por favor, selecciona el archivo datos.csv general.')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.set('archivo', archivo)
      
      const res = await fetch('/api/admin/importacion-masiva', {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      const data = (await res.json().catch(() => null)) as
        | (ResultadoImportMasivo & { error?: string })
        | null
      
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo importar la base de datos masiva.')
        return
      }
      
      if (
        data &&
        typeof data.agregados === 'number'
      ) {
        setResultado({
          agregados: data.agregados,
          omitidosDuplicado: data.omitidosDuplicado,
          clubesNoEncontradosEnRenglon: data.clubesNoEncontradosEnRenglon,
          filasConErrorSevero: data.filasConErrorSevero,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 transition-opacity backdrop-blur-sm"
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
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl sm:max-w-xl sm:p-8"
        onClick={(ev) => ev.stopPropagation()}
      >
        {resultado ? (
          <div>
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
                <IconCheckCircle className="h-8 w-8" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id={`${baseId}-titulo`} className="text-xl font-bold text-slate-900">
                  Importación Masiva Terminada
                </h2>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li className="flex justify-between items-center bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                    <span className="font-semibold text-emerald-900">Personas/Vínculos Agregados:</span>{' '}
                    <strong className="text-emerald-700 text-lg">{resultado.agregados}</strong>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-100 px-3 py-2">
                    <span>Omitidos (Ya existían en su club):</span>{' '}
                    <strong className="text-amber-600">{resultado.omitidosDuplicado}</strong>
                  </li>
                  <li className="flex justify-between items-center border-b border-slate-100 px-3 py-2">
                    <span>Omitidos (El Club no existía en el Sistema):</span>{' '}
                    <strong className="text-rose-600">{resultado.clubesNoEncontradosEnRenglon}</strong>
                  </li>
                  <li className="flex justify-between items-center px-3 py-2">
                    <span>Faltaba Nombre o RUT:</span>{' '}
                    <strong>{resultado.filasConErrorSevero}</strong>
                  </li>
                </ul>
                <p className="mt-4 text-xs leading-relaxed text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  El motor relaja las restricciones de formato en esta pasada masiva para garantizar que todos los
                  miembros listados formen parte de la base de datos sin rebote de formato de RUT. 
                  Solo se desestiman las asignaciones imposibles (club inexistente o vacío).
                </p>
                {resultado.errores.length > 0 ? (
                  <div className="mt-4 max-h-40 overflow-y-auto rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 shadow-sm">
                    <p className="font-bold flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-rose-600"></span>
                      Detalle de Registros Fallidos (Top 100)
                    </p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      {resultado.errores.slice(0, 100).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={() => cerrar()}
              className="mt-8 block w-full rounded-lg bg-blue-800 py-3 text-center text-sm font-bold text-white shadow-md transition hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-800"
            >
              Cerrar Resumen y Ver Clubes
            </button>
          </div>
        ) : (
          <>
            <h2 id={`${baseId}-titulo`} className="text-xl font-extrabold text-blue-900 border-b border-slate-100 pb-3">
              Importación Masiva de la Base Completa (Multiclub)
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              Sube tu archivo <strong className="text-blue-800">datos.csv</strong> general. El motor leerá la columna 
              de <strong>CLUBES ASOCIADOS</strong>, seccionará cada club separado por la barra <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-bold">|</code>, 
              y conectará a cada sujeto físicamente con cada club dentro de la Base de Datos.
            </p>
            <p className="mt-3 text-xs font-semibold text-rose-600 flex items-start gap-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
              <span className="text-base mt-0.5">⚠️</span>
              No saltaremos formatos "malos" ni cerraremos la puerta a nadie. Si el archivo dice que Juan está en 3 clubes, 
              ingresará a los 3. No te permitas cerrar la app mientras la barra trabaje.
            </p>
            <form onSubmit={(e) => void onSubmit(e)} className="mt-6 space-y-6">
              <div>
                <label htmlFor={`${baseId}-file`} className="text-sm font-bold text-slate-900 inline-block mb-2">
                  Selecciona tu archivo CSV Base (Máximo 15MB)
                </label>
                <div className="relative group">
                  <input
                    id={`${baseId}-file`}
                    type="file"
                    accept=".csv,text/csv"
                    className="block w-full text-sm text-slate-600 file:mr-4 file:cursor-pointer file:rounded-xl file:border file:border-slate-200 file:bg-slate-50 file:px-6 file:py-3 file:text-sm file:font-bold file:text-slate-800 hover:file:bg-slate-100 hover:file:shadow-sm"
                    onChange={(ev) => setArchivo(ev.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => cerrar()}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:ring-2 focus:ring-slate-200 outline-none disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !archivo}
                  className="rounded-xl bg-blue-800 px-8 py-3 text-sm font-bold text-white shadow-md transition enabled:hover:bg-blue-900 focus:ring-2 focus:ring-blue-800 outline-none disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Agregando miles de datos...
                    </>
                  ) : (
                    'Iniciar Importación Masiva'
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
