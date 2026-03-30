'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, X } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { ControlHorasResponse, ControlHorasProject } from '@/types'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(h: number) {
  return h === 0 ? '–' : h.toFixed(1)
}

function fmtMonth(m: string) {
  const [y, mo] = m.split('-')
  const names = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${names[parseInt(mo) - 1]} ${y.slice(2)}`
}

function budgetLabel(b: number | null, isEstimated: boolean) {
  if (b === null) return '∞'
  if (b === 0) return '🚫'
  return isEstimated ? `${b} est.` : String(b)
}

function statusBadge(s: ControlHorasProject['status']) {
  switch (s) {
    case 'ok':         return <span className="text-green-600 font-semibold">🟢 OK</span>
    case 'warning':    return <span className="text-yellow-600 font-semibold">🟡 &gt;80%</span>
    case 'exceeded':   return <span className="text-red-600 font-semibold">🔴 Excedido</span>
    case 'unlimited':  return <span className="text-blue-500 font-semibold">∞</span>
    case 'no-billable': return <span className="text-gray-400 font-semibold">🚫</span>
  }
}

function rowBg(s: ControlHorasProject['status']) {
  switch (s) {
    case 'exceeded':   return 'bg-red-50'
    case 'warning':    return 'bg-yellow-50'
    case 'no-billable': return 'bg-gray-50'
    default:           return ''
  }
}

const today = new Date()
const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

// ─── Tab Acumulado ─────────────────────────────────────────────────────────────

function TabAcumulado({ data }: { data: ControlHorasResponse }) {
  const { months, projects } = data
  const [showBillable, setShowBillable] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500">
          {projects.length} proyectos · {months.length} meses ·{' '}
          {fmt(projects.reduce((s, p) => s + p.totalGross, 0))} h brutas ·{' '}
          {fmt(projects.reduce((s, p) => s + p.totalBillable, 0))} h facturables
        </p>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showBillable}
            onChange={(e) => setShowBillable(e.target.checked)}
            className="rounded"
          />
          Mostrar horas facturables por mes
        </label>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="text-xs whitespace-nowrap">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="sticky left-0 z-10 bg-gray-100 px-3 py-2 text-left font-semibold min-w-[160px]">Proyecto</th>
              <th className="px-3 py-2 text-right font-semibold min-w-[80px]">Presupuesto</th>
              {months.map((m) => (
                <th key={m} className="px-2 py-2 text-right font-semibold min-w-[60px]">{fmtMonth(m)}</th>
              ))}
              <th className="px-3 py-2 text-right font-semibold min-w-[80px] border-l">Total Bruto</th>
              <th className="px-3 py-2 text-right font-semibold min-w-[90px]">Total Fact.</th>
              <th className="px-3 py-2 text-right font-semibold min-w-[80px]">Excedente</th>
              <th className="px-3 py-2 text-center font-semibold min-w-[90px]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.projectId} className={`border-b hover:bg-blue-50/30 ${rowBg(p.status)}`}>
                <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.projectColor }} />
                    <span className="font-medium">{p.projectName}</span>
                  </div>
                </td>
                <td className="px-3 py-1.5 text-right text-gray-600">{budgetLabel(p.budgetHours, p.budgetIsEstimated)}</td>
                {months.map((m) => {
                  const val = showBillable ? (p.monthlyBillable[m] ?? 0) : (p.monthlyGross[m] ?? 0)
                  return (
                    <td key={m} className="px-2 py-1.5 text-right text-gray-700">
                      {val > 0 ? val.toFixed(1) : '–'}
                    </td>
                  )
                })}
                <td className="px-3 py-1.5 text-right font-medium border-l">{fmt(p.totalGross)}</td>
                <td className={`px-3 py-1.5 text-right font-semibold ${p.status === 'no-billable' ? 'text-gray-400' : 'text-blue-700'}`}>
                  {fmt(p.totalBillable)}
                </td>
                <td className={`px-3 py-1.5 text-right ${p.surplus > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                  {p.surplus > 0 ? fmt(p.surplus) : '–'}
                </td>
                <td className="px-3 py-1.5 text-center">{statusBadge(p.status)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-semibold border-t-2">
              <td className="sticky left-0 z-10 bg-gray-100 px-3 py-2">TOTAL</td>
              <td />
              {months.map((m) => {
                const total = projects.reduce((s, p) => s + (showBillable ? (p.monthlyBillable[m] ?? 0) : (p.monthlyGross[m] ?? 0)), 0)
                return (
                  <td key={m} className="px-2 py-2 text-right">{total > 0 ? total.toFixed(1) : '–'}</td>
                )
              })}
              <td className="px-3 py-2 text-right border-l">{fmt(projects.reduce((s, p) => s + p.totalGross, 0))}</td>
              <td className="px-3 py-2 text-right text-blue-700">{fmt(projects.reduce((s, p) => s + p.totalBillable, 0))}</td>
              <td className="px-3 py-2 text-right text-red-600">{fmt(projects.reduce((s, p) => s + p.surplus, 0))}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

// ─── Tab Mes Actual ────────────────────────────────────────────────────────────

function TabMesActual({ data }: { data: ControlHorasResponse }) {
  const { months, projects } = data
  const [selectedMonth, setSelectedMonth] = useState(
    months.includes(currentMonth) ? currentMonth : (months[months.length - 1] ?? currentMonth)
  )

  const rows = useMemo(() => {
    return projects
      .filter((p) => (p.monthlyGross[selectedMonth] ?? 0) > 0)
      .map((p) => ({
        ...p,
        gross: p.monthlyGross[selectedMonth] ?? 0,
        billable: p.monthlyBillable[selectedMonth] ?? 0,
        surplus: (p.monthlyGross[selectedMonth] ?? 0) - (p.monthlyBillable[selectedMonth] ?? 0),
      }))
      .sort((a, b) => b.gross - a.gross)
  }, [projects, selectedMonth])

  const totalGross = rows.reduce((s, r) => s + r.gross, 0)
  const totalBillable = rows.reduce((s, r) => s + r.billable, 0)
  const totalSurplus = rows.reduce((s, r) => s + r.surplus, 0)
  const totalInternal = rows.filter((r) => r.status === 'no-billable').reduce((s, r) => s + r.gross, 0)

  return (
    <div className="space-y-4">
      {/* Month picker */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Mes:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm"
        >
          {months.map((m) => (
            <option key={m} value={m}>{fmtMonth(m)}</option>
          ))}
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Horas registradas', value: fmt(totalGross), color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'Horas facturables', value: fmt(totalBillable), color: 'bg-green-50 border-green-200 text-green-700' },
          { label: 'Horas excedentes', value: fmt(totalSurplus), color: totalSurplus > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500' },
          { label: 'Horas internas', value: fmt(totalInternal), color: 'bg-gray-50 border-gray-200 text-gray-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg border p-3 ${color}`}>
            <p className="text-xs font-medium opacity-70">{label}</p>
            <p className="text-2xl font-bold mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="px-4 py-2 text-left font-semibold">Proyecto</th>
              <th className="px-4 py-2 text-right font-semibold">Presupuesto</th>
              <th className="px-4 py-2 text-right font-semibold">Horas Brutas</th>
              <th className="px-4 py-2 text-right font-semibold text-blue-700">Horas Fact.</th>
              <th className="px-4 py-2 text-right font-semibold">Excedente</th>
              <th className="px-4 py-2 text-center font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">Sin registros para este mes</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.projectId} className={`border-b hover:bg-blue-50/30 ${rowBg(r.status)}`}>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.projectColor }} />
                    <span className="font-medium">{r.projectName}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right text-gray-600">{budgetLabel(r.budgetHours, r.budgetIsEstimated)}</td>
                <td className="px-4 py-2 text-right">{fmt(r.gross)}</td>
                <td className={`px-4 py-2 text-right font-semibold ${r.status === 'no-billable' ? 'text-gray-400' : 'text-blue-700'}`}>
                  {fmt(r.billable)}
                </td>
                <td className={`px-4 py-2 text-right ${r.surplus > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                  {r.surplus > 0 ? fmt(r.surplus) : '–'}
                </td>
                <td className="px-4 py-2 text-center">{statusBadge(r.status)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="bg-gray-100 font-semibold border-t-2 text-sm">
                <td className="px-4 py-2">TOTAL</td>
                <td />
                <td className="px-4 py-2 text-right">{fmt(totalGross)}</td>
                <td className="px-4 py-2 text-right text-blue-700">{fmt(totalBillable)}</td>
                <td className={`px-4 py-2 text-right ${totalSurplus > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                  {totalSurplus > 0 ? fmt(totalSurplus) : '–'}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

// ─── Tab Dashboard ─────────────────────────────────────────────────────────────

function TabDashboard({ data }: { data: ControlHorasResponse }) {
  const { months, projects } = data

  // Budget vs consumed (only projects with a defined budget > 0)
  const budgetData = projects
    .filter((p) => p.budgetHours != null && p.budgetHours > 0)
    .map((p) => ({
      name: p.projectName.length > 18 ? p.projectName.slice(0, 16) + '…' : p.projectName,
      Presupuesto: p.budgetHours!,
      Consumido: parseFloat(p.totalBillable.toFixed(1)),
      fill: p.projectColor,
    }))
    .sort((a, b) => b.Presupuesto - a.Presupuesto)
    .slice(0, 12)

  // Monthly billable evolution
  const monthlyData = months.map((m) => ({
    month: fmtMonth(m),
    'Horas Brutas': parseFloat(projects.reduce((s, p) => s + (p.monthlyGross[m] ?? 0), 0).toFixed(1)),
    'Facturables': parseFloat(projects.reduce((s, p) => s + (p.monthlyBillable[m] ?? 0), 0).toFixed(1)),
  }))

  // Billable distribution by project (top 10)
  const pieData = projects
    .filter((p) => p.totalBillable > 0)
    .sort((a, b) => b.totalBillable - a.totalBillable)
    .slice(0, 10)
    .map((p) => ({ name: p.projectName, value: parseFloat(p.totalBillable.toFixed(1)), fill: p.projectColor }))

  return (
    <div className="space-y-8">
      {/* Budget vs Consumed */}
      {budgetData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Presupuesto vs Horas Facturables</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={budgetData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: unknown) => `${(v as number).toFixed(1)} h`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Presupuesto" fill="#d1d5db" radius={[0, 3, 3, 0]} />
              <Bar dataKey="Consumido" radius={[0, 3, 3, 0]}>
                {budgetData.map((d, i) => (
                  <Cell key={i} fill={d.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monthly evolution */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Evolución mensual de horas</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={monthlyData} margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: unknown) => `${(v as number).toFixed(1)} h`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Horas Brutas" stroke="#94a3b8" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Facturables" stroke="#2563eb" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Billable distribution */}
      {pieData.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Distribución horas facturables por proyecto</h3>
          <div className="flex gap-8 items-center flex-wrap">
            <ResponsiveContainer width={280} height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="value"
                >
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: unknown) => `${(v as number).toFixed(1)} h`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: d.fill }} />
                  <span className="text-gray-700">{d.name}</span>
                  <span className="text-gray-500 ml-1">{d.value.toFixed(1)} h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Project multi-select filter ──────────────────────────────────────────────

interface ProjectFilterProps {
  allProjects: ControlHorasProject[]
  selected: Set<number>
  onChange: (s: Set<number>) => void
}

function ProjectFilter({ allProjects, selected, onChange }: ProjectFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const allSelected = selected.size === 0
  const label = allSelected
    ? 'Todos los proyectos'
    : `${selected.size} proyecto${selected.size !== 1 ? 's' : ''}`

  const toggle = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white hover:border-[#0170B9] transition-colors min-w-[180px]"
      >
        <span className="flex-1 text-left text-gray-700">{label}</span>
        {!allSelected && (
          <span
            onClick={(e) => { e.stopPropagation(); onChange(new Set()) }}
            className="text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={13} />
          </span>
        )}
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[240px] max-h-72 overflow-y-auto">
          {/* All option */}
          <button
            onClick={() => { onChange(new Set()); setOpen(false) }}
            className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 border-b ${allSelected ? 'font-semibold text-[#0170B9]' : 'text-gray-700'}`}
          >
            Todos los proyectos
          </button>
          {/* Individual projects */}
          {allProjects.map((p) => (
            <label key={p.projectId} className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(p.projectId)}
                onChange={() => toggle(p.projectId)}
                className="rounded"
              />
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: p.projectColor }}
              />
              <span className="truncate text-gray-700">{p.projectName}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'acumulado' | 'mes-actual' | 'dashboard'

export default function ControlHorasPage() {
  const [tab, setTab] = useState<Tab>('acumulado')
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set())

  const { data, isLoading, error } = useQuery<ControlHorasResponse>({
    queryKey: ['control-horas'],
    queryFn: () => fetch('/api/control-horas').then((r) => r.json()),
  })

  // Apply project filter across all tabs
  const filteredData = useMemo<ControlHorasResponse | null>(() => {
    if (!data) return null
    if (selectedProjects.size === 0) return data
    return {
      ...data,
      projects: data.projects.filter((p) => selectedProjects.has(p.projectId)),
    }
  }, [data, selectedProjects])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'acumulado', label: 'Acumulado' },
    { id: 'mes-actual', label: 'Mes Actual' },
    { id: 'dashboard', label: 'Dashboard' },
  ]

  return (
    <div className="p-6 max-w-full">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Control de Horas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seguimiento de horas facturables por proyecto vs presupuesto asignado
        </p>
      </div>

      {/* Tabs + Project filter */}
      <div className="flex items-end justify-between border-b mb-5">
        <div className="flex gap-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === id
                  ? 'border-[#0170B9] text-[#0170B9]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {data && data.projects.length > 0 && (
          <div className="pb-2">
            <ProjectFilter
              allProjects={data.projects}
              selected={selectedProjects}
              onChange={setSelectedProjects}
            />
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Cargando datos…
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700 text-sm">
          Error al cargar datos
        </div>
      )}

      {data && data.projects.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Sin datos de horas</p>
          <p className="text-sm mt-1">Importá horas desde la sección Reporte de Horas</p>
        </div>
      )}

      {filteredData && filteredData.projects.length > 0 && (
        <>
          {tab === 'acumulado' && <TabAcumulado data={filteredData} />}
          {tab === 'mes-actual' && <TabMesActual data={filteredData} />}
          {tab === 'dashboard' && <TabDashboard data={filteredData} />}
        </>
      )}

      {filteredData && filteredData.projects.length === 0 && data && data.projects.length > 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">Sin proyectos para el filtro seleccionado</p>
          <button onClick={() => setSelectedProjects(new Set())} className="text-sm text-[#0170B9] hover:underline mt-1">
            Mostrar todos
          </button>
        </div>
      )}
    </div>
  )
}
