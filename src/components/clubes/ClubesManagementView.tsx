'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ROUTES } from '@/constants'
import {
  IconBuilding,
  IconCheckCircle,
  IconLayoutGrid,
  IconListRows,
  IconMapPin,
  IconPencil,
  IconSearch,
  IconTrash,
  IconUser,
  IconUsersTwo,
} from '@/components/layout/icons/NavIcons'
import { ClubDeleteConfirmModal } from '@/components/clubes/ClubDeleteConfirmModal'
import { EditarClubModal } from '@/components/clubes/EditarClubModal'
import { NuevoClubModal } from '@/components/clubes/NuevoClubModal'
import { CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton'
import type { ClubCliente, ClubesResumenTotales } from '@/types/club.types'

const PAGE_SIZE = 10

type FiltroEstado = 'todos' | 'activos' | 'inactivos'
type VistaModo = 'lista' | 'cuadricula'

async function fetchClubes({
  page,
  limit,
  all = false,
}: {
  page?: number
  limit?: number
  all?: boolean
}): Promise<{ clubes: ClubCliente[]; panel?: ClubesResumenTotales }> {
  const params = new URLSearchParams()
  if (all) {
    // Para búsqueda/filtrado local fluido si se desea
  } else if (page && limit) {
    params.set('page', String(page))
    params.set('limit', String(limit))
  }

  const res = await fetch(`/api/clubes?${params.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Error al cargar clubes')
  }
  return await res.json()
}

export interface ClubesManagementViewProps {
  initialTotales: ClubesResumenTotales
  puedeGestionar: boolean
  nuevoModalOpen: boolean
  onNuevoModalOpenChange: (open: boolean) => void
  onRegisterRefrescar: (fn: () => Promise<void>) => void
}

export function ClubesManagementView({
  initialTotales,
  puedeGestionar,
  nuevoModalOpen,
  onNuevoModalOpenChange,
  onRegisterRefrescar,
}: ClubesManagementViewProps) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [vista, setVista] = useState<VistaModo>('lista')
  const [pagina, setPagina] = useState(1)
  const [editar, setEditar] = useState<ClubCliente | null>(null)
  const [eliminar, setEliminar] = useState<ClubCliente | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)
  const [pendingEliminar, setPendingEliminar] = useState(false)

  // Consulta única: Trae o usa todos los clubes, paginados en cliente.
  const queryTodos = useQuery({
    queryKey: ['clubes', 'all'],
    queryFn: () => fetchClubes({ all: true }),
  })

  // Filtro activo en cliente
  const filtroCliente = query.trim() !== '' || filtro !== 'todos'

  const muestraCargando = queryTodos.isLoading
  const isBackgroundUpdating = queryTodos.isFetching && !queryTodos.isLoading

  const totales = queryTodos.data?.panel || initialTotales
  const todosLosClubes = queryTodos.data?.clubes || []

  const filtradosCompletos = useMemo(() => {
    if (!filtroCliente) return todosLosClubes
    const q = query.trim().toLowerCase()
    return todosLosClubes.filter((c) => {
      if (filtro === 'activos' && !c.activo) return false
      if (filtro === 'inactivos' && c.activo) return false
      if (!q) return true
      const blob = `${c.nombre} ${c.comuna} ${c.region}`.toLowerCase()
      return blob.includes(q)
    })
  }, [filtroCliente, todosLosClubes, query, filtro])

  const totalTodos = totales.totalClubes
  const totalPaginas = Math.max(1, Math.ceil(filtradosCompletos.length / PAGE_SIZE))

  useEffect(() => {
    setPagina(1)
  }, [query, filtro])

  const paginaSegura = Math.min(pagina, totalPaginas)

  const filas = useMemo(() => {
    const start = (paginaSegura - 1) * PAGE_SIZE
    return filtradosCompletos.slice(start, start + PAGE_SIZE)
  }, [filtradosCompletos, paginaSegura])

  const totalResultadosListado = filtradosCompletos.length
  const mostrandoDesde = totalResultadosListado === 0 ? 0 : (paginaSegura - 1) * PAGE_SIZE + 1
  const mostrandoHasta = Math.min(paginaSegura * PAGE_SIZE, totalResultadosListado)

    const refrescarActual = useCallback(async () => {
      await queryClient.invalidateQueries({ queryKey: ['clubes'] })
    }, [queryClient])

    useEffect(() => {
      onRegisterRefrescar(refrescarActual)
    }, [onRegisterRefrescar, refrescarActual])

    async function confirmarEliminar() {
      const c = eliminar
      if (!c) return
      setPendingEliminar(true)
      setErrorEliminar(null)
      try {
        const res = await fetch(`/api/clubes/${encodeURIComponent(c.id)}`, {
          method: 'DELETE',
          credentials: 'include',
        })
        if (!res.ok) {
          const err = await res.json().catch(() => null)
          setErrorEliminar(err?.error ?? 'No se pudo eliminar el club')
          return
        }
        await queryClient.invalidateQueries({ queryKey: ['clubes'] })
        setEliminar(null)
      } finally {
        setPendingEliminar(false)
      }
    }

    async function onCreado() {
      await queryClient.invalidateQueries({ queryKey: ['clubes'] })
    }

    const pills = (
      filt: FiltroEstado,
      label: string,
    ) => (
      <button
        type="button"
        onClick={() => setFiltro(filt)}
        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition sm:text-sm ${filtro === filt
          ? 'border-l-[0.1875rem] border-lime-400 bg-blue-800 text-white shadow-sm'
          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
      >
        {label}
      </button>
    )

  const listaVaciaServidor =
    !filtroCliente && !muestraCargando && filas.length === 0 && totalTodos === 0
  const listaVaciaFiltro =
    filtroCliente && !muestraCargando && Boolean(queryTodos.data) && filtradosCompletos.length === 0
  const sinCoincidenciasTabla =
    !muestraCargando && filas.length === 0 && !listaVaciaServidor && !listaVaciaFiltro

    return (
      <div className={`flex flex-col gap-6 transition-opacity duration-300 ${isBackgroundUpdating ? 'opacity-60' : 'opacity-100'}`}>
        <NuevoClubModal
          open={nuevoModalOpen}
          onClose={() => onNuevoModalOpenChange(false)}
          onCreado={() => void onCreado()}
        />
        <EditarClubModal
          club={editar}
          onClose={() => setEditar(null)}
          onGuardado={() => void queryClient.invalidateQueries({ queryKey: ['clubes'] })}
        />
        <ClubDeleteConfirmModal
          club={eliminar}
          error={errorEliminar}
          loading={pendingEliminar}
          onClose={() => {
            setEliminar(null)
            setErrorEliminar(null)
          }}
          onConfirm={() => void confirmarEliminar()}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {/* ... stats cards stay the same ... */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-t-[3px] border-t-blue-800 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                  <IconBuilding className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalTodos}</p>
                  <p className="text-sm font-bold text-slate-700">Total</p>
                  <p className="text-xs text-slate-500">Clubes registrados</p>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-t-[3px] border-t-green-600 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
                  <IconCheckCircle className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totales.totalClubesActivos}</p>
                  <p className="text-sm font-bold text-slate-700">Activos</p>
                  <p className="text-xs text-slate-500">En operación</p>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-t-[3px] border-t-amber-500 bg-white px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <IconUsersTwo className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totales.totalMiembros}</p>
                  <p className="text-sm font-bold text-slate-700">Miembros</p>
                  <p className="text-xs text-slate-500">Total adultos mayores</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1">
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar club…"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
              aria-label="Buscar club"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pills('todos', 'Todos')}
            {pills('activos', 'Activos')}
            {pills('inactivos', 'Inactivos')}
            <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline" aria-hidden />
            <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              <button
                type="button"
                aria-pressed={vista === 'cuadricula'}
                onClick={() => setVista('cuadricula')}
                className={`rounded-md p-2 transition ${vista === 'cuadricula' ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                title="Vista cuadrícula"
              >
                <IconLayoutGrid className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-pressed={vista === 'lista'}
                onClick={() => setVista('lista')}
                className={`rounded-md p-2 transition ${vista === 'lista' ? 'bg-blue-800 text-white' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                title="Vista lista"
              >
                <IconListRows className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          {filtroCliente
            ? `${filtradosCompletos.length} clubes con los filtros actuales`
            : `${totalTodos} clubes · página ${paginaSegura} de ${totalPaginas}`}
          {query.trim() ? ` (búsqueda activa)` : ''}
        </p>

        {muestraCargando ? (
          vista === 'lista' ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[0.6875rem] font-bold uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Nombre del club</th>
                      <th className="px-4 py-3">Comuna</th>
                      <th className="hidden px-4 py-3 md:table-cell">Región</th>
                      <th className="px-4 py-3">Miembros</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <TableRowSkeleton key={i} columns={6} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          )
        ) : totalResultadosListado === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500 shadow-sm">
            {filtroCliente ? 'No hay clubes que coincidan con los filtros.' : 'No hay clubes en la colección.'}
          </div>
        ) : vista === 'lista' ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[52rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[0.6875rem] font-bold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Nombre del club</th>
                    <th className="px-4 py-3">Comuna</th>
                    <th className="hidden px-4 py-3 md:table-cell">Región</th>
                    <th className="px-4 py-3">Miembros</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filas.map((c) => (
                    <tr key={c.id} className="text-slate-800">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${c.activo ? 'bg-green-500' : 'bg-slate-300'}`}
                            aria-hidden
                          />
                          <span className="font-bold text-slate-900">{c.nombre}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <IconMapPin className="h-4 w-4 shrink-0 text-slate-400" />
                          {c.comuna}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{c.region}</td>
                      <td className="px-4 py-3 font-medium tabular-nums">{c.miembros}</td>
                      <td className="px-4 py-3">
                        {c.activo ? (
                          <span className="inline-flex rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-200">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`${ROUTES.adminMiembrosClubes}?club=${encodeURIComponent(c.id)}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-800 shadow-sm transition hover:bg-slate-50"
                          >
                            <IconUser className="h-3.5 w-3.5" />
                            Miembros
                          </Link>
                          {puedeGestionar ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditar(c)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                              >
                                <IconPencil className="h-3.5 w-3.5" />
                                Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEliminar(c)
                                  setErrorEliminar(null)
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                              >
                                <IconTrash className="h-3.5 w-3.5" />
                                Eliminar
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filas.map((c) => (
              <div
                key={c.id}
                className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                {/* ... card content same as before but using c ... */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`mt-1 h-2 w-2 shrink-0 rounded-full ${c.activo ? 'bg-green-500' : 'bg-slate-300'}`}
                    />
                    <h3 className="truncate font-bold text-slate-900">{c.nombre}</h3>
                  </div>
                  {c.activo ? (
                    <span className="shrink-0 rounded-md bg-green-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-green-800">
                      Activo
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[0.6875rem] font-semibold text-slate-600">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <IconMapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  <span className="truncate">
                    {c.comuna} · {c.region}
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="font-semibold text-slate-800">{c.miembros}</span> miembros
                </p>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`${ROUTES.adminMiembrosClubes}?club=${encodeURIComponent(c.id)}`}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-blue-800 shadow-sm transition hover:bg-slate-50"
                  >
                    <IconUser className="h-3.5 w-3.5" />
                    Miembros
                  </Link>
                  {puedeGestionar ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setEditar(c)}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                      >
                        <IconPencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEliminar(c)
                          setErrorEliminar(null)
                        }}
                        className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-white py-2 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {filas.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Mostrando {mostrandoDesde} a {mostrandoHasta} de {totalResultadosListado} resultados
            </p>
            <nav className="flex flex-wrap items-center gap-1" aria-label="Paginación">
              <button
                type="button"
                disabled={paginaSegura <= 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
              >
                Anterior
              </button>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter((n) => {
                  if (totalPaginas <= 7) {
                    return true
                  }
                  return (
                    n === 1 ||
                    n === totalPaginas ||
                    Math.abs(n - paginaSegura) <= 1
                  )
                })
                .map((n, idx, arr) => {
                  const prev = arr[idx - 1]
                  const showEllipsis = prev != null && n - prev > 1
                  return (
                    <span key={n} className="flex items-center gap-1">
                      {showEllipsis ? (
                        <span className="px-1 text-slate-400" aria-hidden>
                          …
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setPagina(n)}
                        className={`min-w-[2.25rem] rounded-lg px-2 py-1.5 text-sm font-bold shadow-sm transition ${paginaSegura === n
                          ? 'bg-blue-800 text-white'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                      >
                        {n}
                      </button>
                    </span>
                  )
                })}
              <button
                type="button"
                disabled={paginaSegura >= totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
              >
                Siguiente
              </button>
            </nav>
          </div>
        ) : null}
      </div>
    )
  }
