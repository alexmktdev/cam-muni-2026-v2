'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  statsRutEnPanel: boolean
  puedeActualizar: boolean
}

/**
 * Explica que los conteos RUT del panel ya no se calculan en cada carga (ahorro de lecturas Firestore).
 */
export function DashboardRutStatsCallout({ statsRutEnPanel, puedeActualizar }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onActualizar() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/miembros/recompute-stats-rut', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null
        setError(j?.error ?? 'No se pudo actualizar')
        return
      }
      router.refresh()
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  if (statsRutEnPanel) {
    return (
      <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <p>
          El gráfico «Personas por pertenencia a clubes» usa valores guardados en Firestore para no leer
          toda la base de miembros en cada visita. Tras importaciones masivas o cambios grandes, pulse{' '}
          {puedeActualizar ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void onActualizar()}
              className="font-semibold text-blue-800 underline decoration-blue-800/40 hover:decoration-blue-800 disabled:opacity-50"
            >
              {loading ? 'Actualizando…' : 'Actualizar estadísticas RUT'}
            </button>
          ) : (
            <span className="font-semibold text-slate-700">Actualizar estadísticas RUT</span>
          )}{' '}
          (consume una lectura por cada miembro, una sola vez).
        </p>
        {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-950">
      <p className="font-semibold text-amber-950">Gráfico de personas por RUT</p>
      <p className="mt-1 text-amber-900/90">
        Aún no hay conteos guardados: el panel ya no recorre automáticamente todos los miembros (así se
        respeta la cuota gratuita de Firestore). Pulse el botón para calcularlos una vez y guardarlos.
      </p>
      {puedeActualizar ? (
        <button
          type="button"
          disabled={loading}
          onClick={() => void onActualizar()}
          className="mt-3 inline-flex items-center rounded-lg bg-amber-800 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-900 disabled:opacity-50"
        >
          {loading ? 'Calculando…' : 'Generar estadísticas RUT ahora'}
        </button>
      ) : (
        <p className="mt-2 text-amber-900/80">Pídale a un administrador que ejecute esta acción.</p>
      )}
      {error ? <p className="mt-2 text-sm font-medium text-red-700">{error}</p> : null}
    </div>
  )
}
