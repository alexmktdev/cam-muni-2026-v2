// Cliente: cabecera con acciones + vista de clubes (modal nuevo club en la cabecera).

'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { TEXTO_SUBTITULO_ADMIN_CLUBES } from '@/constants'
import { AppMainSection } from '@/components/layout/AppMainSection'
import { IconBuilding, IconPlus, IconRefresh, IconTrash } from '@/components/layout/icons/NavIcons'
import { ClubesManagementView } from '@/components/clubes/ClubesManagementView'
import { ImportarCsvMasivoSistemaModal } from '@/components/admin/ImportarCsvMasivoSistemaModal'
import { ResetMiembrosPostImportModal } from '@/components/clubes/ResetMiembrosPostImportModal'
import type { ClubCliente, ClubesResumenTotales } from '@/types/club.types'

export interface AdminClubesShellProps {
  initialTotales: ClubesResumenTotales
  puedeGestionar: boolean
}

export function AdminClubesShell({
  initialTotales,
  puedeGestionar,
}: AdminClubesShellProps) {
  const router = useRouter()
  const [modalNuevo, setModalNuevo] = useState(false)
  const [modalResetMigracion, setModalResetMigracion] = useState(false)
  const [modalImportacionMasiva, setModalImportacionMasiva] = useState(false)
  const [actualizando, setActualizando] = useState(false)
  const [sincronizandoContadores, setSincronizandoContadores] = useState(false)
  const refrescarRef = useRef<() => Promise<void>>(async () => {})

  const registrarRefrescar = useCallback((fn: () => Promise<void>) => {
    refrescarRef.current = fn
  }, [])

  async function onActualizar() {
    setActualizando(true)
    try {
      await refrescarRef.current()
    } finally {
      setActualizando(false)
    }
  }

  async function onSincronizarContadoresMiembros() {
    setSincronizandoContadores(true)
    try {
      const res = await fetch('/api/clubes/sincronizar-contadores-miembros', {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        return
      }
      await refrescarRef.current()
    } finally {
      setSincronizandoContadores(false)
    }
  }

  return (
    <AppMainSection
      title="Gestión de Clubes"
      subtitle={TEXTO_SUBTITULO_ADMIN_CLUBES}
      TitleIcon={IconBuilding}
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
          <ResetMiembrosPostImportModal
            open={modalResetMigracion}
            onClose={() => setModalResetMigracion(false)}
            onListo={() => {
              void refrescarRef.current()
              router.refresh()
            }}
          />
          <ImportarCsvMasivoSistemaModal
            open={modalImportacionMasiva}
            onClose={() => setModalImportacionMasiva(false)}
            onImportado={() => {
              void refrescarRef.current()
              router.refresh()
            }}
          />
          {puedeGestionar ? (
            <>
              <button
                type="button"
                onClick={() => setModalNuevo(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-900 sm:w-auto"
              >
                <IconPlus className="h-5 w-5" aria-hidden />
                Agregar nuevo club
              </button>
              <button
                type="button"
                onClick={() => setModalImportacionMasiva(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-900 shadow-sm transition hover:bg-purple-100 sm:w-auto"
              >
                Importar Base CSV
              </button>
              <button
                type="button"
                disabled={sincronizandoContadores}
                onClick={() => void onSincronizarContadoresMiembros()}
                title="Iguala la columna «Miembros» con los registros reales de la pestaña de gestión de miembros"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm font-bold text-amber-950 shadow-sm transition hover:bg-amber-100 disabled:opacity-50 sm:w-auto"
              >
                <IconRefresh
                  className={`h-5 w-5 shrink-0 ${sincronizandoContadores ? 'animate-spin' : ''}`}
                  aria-hidden
                />
                {sincronizandoContadores ? 'Sincronizando…' : 'Alinear contadores de miembros'}
              </button>
              <button
                type="button"
                onClick={() => setModalResetMigracion(true)}
                title="Borra todos los registros de miembros y deja el contador en 0 en cada club (tras migración desde otro sistema)"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-950 shadow-sm transition hover:bg-orange-100 sm:w-auto"
              >
                <IconTrash className="h-5 w-5 shrink-0" aria-hidden />
                Dejar miembros en 0 (migración)
              </button>
            </>
          ) : null}
          <button
            type="button"
            disabled={actualizando}
            onClick={() => void onActualizar()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto"
          >
            <IconRefresh className={`h-5 w-5 ${actualizando ? 'animate-spin' : ''}`} aria-hidden />
            {actualizando ? 'Actualizando…' : 'Actualizar listado'}
          </button>
        </div>
      }
    >
      <ClubesManagementView
        initialTotales={initialTotales}
        puedeGestionar={puedeGestionar}
        nuevoModalOpen={modalNuevo}
        onNuevoModalOpenChange={setModalNuevo}
        onRegisterRefrescar={registrarRefrescar}
      />
    </AppMainSection>
  )
}
