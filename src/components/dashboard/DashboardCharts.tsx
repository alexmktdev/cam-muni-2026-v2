'use client'

import type { ReactNode } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type ClubMiembroChartFila = {
  nombre: string
  miembros: number
}

export type DashboardChartsProps = {
  topClubes: ClubMiembroChartFila[]
  bottomClubes: ClubMiembroChartFila[]
  statsPersonas: {
    unicos: number
    duplicados: number
  }
  /** true: valores 0/0 hasta que un admin ejecute el recálculo guardado en panel. */
  statsRutSonAproximados?: boolean
  clubesActivoInactivo: {
    activos: number
    inactivos: number
  }
}

const AZUL = '#1e40af'
const AZUL_CLARO = '#3b82f6'
const AMBAR = '#d97706'
const AMBAR_CLARO = '#fbbf24'
const VERDE = '#16a34a'
const GRIS = '#94a3b8'

function truncarEtiqueta(s: string, max = 30): string {
  const t = s.trim()
  if (t.length <= max) {
    return t
  }
  return `${t.slice(0, max - 1)}…`
}

function ChartCard({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
      {descripcion ? (
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{descripcion}</p>
      ) : null}
      <div className="mt-4 min-h-[280px] flex-1">{children}</div>
    </div>
  )
}

export function DashboardCharts({
  topClubes,
  bottomClubes,
  statsPersonas,
  statsRutSonAproximados = false,
  clubesActivoInactivo,
}: DashboardChartsProps) {
  const datosTop = topClubes.map((c) => ({
    nombre: truncarEtiqueta(c.nombre),
    miembros: c.miembros,
  }))
  const datosBottom = bottomClubes.map((c) => ({
    nombre: truncarEtiqueta(c.nombre),
    miembros: c.miembros,
  }))

  const datosPersonas = [
    { name: 'Solo en un club', value: statsPersonas.unicos, fill: AZUL },
    { name: 'En varios clubes', value: statsPersonas.duplicados, fill: AMBAR },
  ].filter((d) => d.value > 0)

  const datosActivos = [
    { name: 'Clubes activos', value: clubesActivoInactivo.activos, fill: VERDE },
    { name: 'Clubes inactivos', value: clubesActivoInactivo.inactivos, fill: GRIS },
  ].filter((d) => d.value > 0)

  const sinPersonas = statsPersonas.unicos + statsPersonas.duplicados === 0
  const sinClubesEstado =
    clubesActivoInactivo.activos + clubesActivoInactivo.inactivos === 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard
        titulo="Top 10 clubes con más miembros"
        descripcion="Según el contador guardado en cada club (campo miembros)."
      >
        {datosTop.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No hay clubes para mostrar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              layout="vertical"
              data={datosTop}
              margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
              barCategoryGap="36%"
            >
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="nombre"
                width={138}
                tick={{ fontSize: 10 }}
                tickMargin={8}
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v} miembros`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="miembros" fill={AZUL} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        titulo="10 clubes con menos miembros"
        descripcion="Los clubes con menor contador (pueden incluir ceros)."
      >
        {datosBottom.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">No hay clubes para mostrar.</p>
        ) : (
          <ResponsiveContainer width="100%" height={380}>
            <BarChart
              layout="vertical"
              data={datosBottom}
              margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
              barCategoryGap="36%"
            >
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="nombre"
                width={138}
                tick={{ fontSize: 10 }}
                tickMargin={8}
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [`${v} miembros`, '']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="miembros" fill={AZUL_CLARO} radius={[0, 4, 4, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        titulo="Personas por pertenencia a clubes"
        descripcion={
          statsRutSonAproximados
            ? 'Datos leídos desde el resumen en Firestore (no se recalculan solos en cada visita).'
            : 'Misma lógica que la búsqueda global: un RUT cuenta una vez; «varios clubes» si está inscrito en más de uno.'
        }
      >
        {sinPersonas && statsRutSonAproximados ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Use «Generar estadísticas RUT» en el recuadro de arriba para rellenar este gráfico sin
            gastar lecturas en cada navegación.
          </p>
        ) : sinPersonas ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Sin registros de miembros o no hay datos consolidados.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={datosPersonas}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {datosPersonas.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} personas`, '']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        titulo="Clubes activos vs inactivos"
        descripcion="Distribución del catálogo según el campo activo de cada club."
      >
        {sinClubesEstado ? (
          <p className="py-12 text-center text-sm text-slate-500">No hay clubes registrados.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={datosActivos}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={56}
                outerRadius={88}
                paddingAngle={2}
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
              >
                {datosActivos.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [`${v} clubes`, '']} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
