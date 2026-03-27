'use client'

import { useState, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { parse as dateParse } from 'date-fns'
import { enUS } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { Upload, AlertTriangle, CheckCircle2, FileText } from 'lucide-react'
import type {
  ParsedTimeEntry, ImportTimeEntriesResult,
  TimeEntryByResource, TimeEntryByProject, TimeEntryByMonth,
} from '@/types'

// ─── CSV Parsing ────────────────────────────────────────────────────────────

function parseCsvDate(raw: string): string | null {
  const d = dateParse(raw.trim(), 'dd/MMM/yy', new Date(), { locale: enUS })
  if (isNaN(d.getTime())) return null
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0)).toISOString()
}

function parseCsv(buffer: ArrayBuffer): ParsedTimeEntry[] {
  const bytes = new Uint8Array(buffer)
  // Strip UTF-8 BOM
  const start = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0
  const text = new TextDecoder('utf-8').decode(bytes.slice(start))

  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const header = lines[0].split(',')

  // Find date columns (format DD/MMM/YY)
  const dateCols: { index: number; iso: string }[] = []
  for (let i = 5; i < header.length; i++) {
    const iso = parseCsvDate(header[i])
    if (iso) dateCols.push({ index: i, iso })
  }

  const entries: ParsedTimeEntry[] = []

  for (let r = 1; r < lines.length; r++) {
    // Split respecting quoted fields
    const cols = lines[r].split(',')
    const resourceName = cols[1]?.trim() ?? ''
    const projectName = cols[2]?.trim() ?? ''

    // Skip total rows (no project) or empty rows
    if (!resourceName || !projectName) continue

    for (const { index, iso } of dateCols) {
      const raw = cols[index]?.trim() ?? ''
      if (!raw || raw === '0') continue
      const hours = parseFloat(raw)
      if (isNaN(hours) || hours <= 0) continue
      entries.push({ resourceName, projectName, date: iso, hours })
    }
  }

  return entries
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatHours(h: number) {
  return h % 1 === 0 ? h.toFixed(0) : h.toFixed(1)
}

function formatDateDisplay(iso: string) {
  const d = iso.substring(0, 10).split('-')
  return `${d[2]}/${d[1]}/${d[0]}`
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[parseInt(m) - 1]} ${y.slice(2)}`
}

// ─── Tab: Importar ───────────────────────────────────────────────────────────

function TabImport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedTimeEntry[] | null>(null)
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportTimeEntriesResult | null>(null)
  const [error, setError] = useState('')

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    setResult(null)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const buf = e.target?.result as ArrayBuffer
      const entries = parseCsv(buf)
      setParsed(entries)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleImport = async () => {
    if (!parsed) return
    setImporting(true)
    setError('')
    try {
      const res = await fetch('/api/time-entries/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: parsed }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al importar')
      setResult(data)
      setParsed(null)
      setFileName('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al importar')
    } finally {
      setImporting(false)
    }
  }

  // Stats for preview
  const uniqueResources = parsed ? new Set(parsed.map((e) => e.resourceName)).size : 0
  const uniqueProjects = parsed ? new Set(parsed.map((e) => e.projectName)).size : 0

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-[#0170B9] hover:bg-blue-50 transition-colors"
      >
        <Upload className="mx-auto mb-3 text-gray-400" size={36} />
        <p className="text-gray-600 font-medium">Arrastrá el archivo CSV aquí o hacé clic para seleccionarlo</p>
        <p className="text-sm text-gray-400 mt-1">Formato: User, Project, Key, Utilization, Logged, DD/MMM/YY...</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Preview */}
      {parsed && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            <FileText size={18} className="text-[#0170B9]" />
            <span>{fileName}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Entradas detectadas', value: parsed.length.toLocaleString() },
              { label: 'Personas únicas', value: uniqueResources },
              { label: 'Proyectos únicos', value: uniqueProjects },
            ].map((s) => (
              <div key={s.label} className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-[#0170B9]">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-[#0170B9] text-white sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Persona</th>
                  <th className="px-3 py-2 text-left">Proyecto</th>
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 15).map((e, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-1.5">{e.resourceName}</td>
                    <td className="px-3 py-1.5">{e.projectName}</td>
                    <td className="px-3 py-1.5">{formatDateDisplay(e.date)}</td>
                    <td className="px-3 py-1.5 text-right">{formatHours(e.hours)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 15 && (
              <p className="text-xs text-center text-gray-400 py-2">
                ... y {parsed.length - 15} entradas más
              </p>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full bg-[#0170B9] text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? 'Importando...' : `Importar ${parsed.length.toLocaleString()} entradas`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-3">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckCircle2 size={20} />
            Importación completada
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Insertados', value: result.inserted, color: 'text-green-600' },
              { label: 'Actualizados', value: result.updated, color: 'text-blue-600' },
              { label: 'Saltados', value: result.skipped, color: 'text-gray-500' },
            ].map((s) => (
              <div key={s.label} className="border rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${s.color}`}>{s.value.toLocaleString()}</div>
                <div className="text-xs text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
          {result.unmatchedResources.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                <AlertTriangle size={16} /> Personas sin match en la DB
              </div>
              <div className="text-sm text-yellow-800">
                {result.unmatchedResources.join(', ')}
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Creá esos recursos en la sección Recursos y volvé a importar.
              </p>
            </div>
          )}
          {result.unmatchedProjects.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <div className="flex items-center gap-2 text-yellow-700 font-medium mb-1">
                <AlertTriangle size={16} /> Proyectos sin match en la DB
              </div>
              <div className="text-sm text-yellow-800">
                {result.unmatchedProjects.join(', ')}
              </div>
              <p className="text-xs text-yellow-600 mt-1">
                Creá esos proyectos en la sección Proyectos y volvé a importar.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Tab: Tabla ──────────────────────────────────────────────────────────────

function TabTabla() {
  const [resourceId, setResourceId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [month, setMonth] = useState('')
  const [page, setPage] = useState(1)

  const { data: resources } = useQuery({
    queryKey: ['resources'],
    queryFn: () => fetch('/api/resources').then((r) => r.json()),
  })
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  })

  const params = new URLSearchParams({
    view: 'raw',
    page: String(page),
    pageSize: '100',
    ...(resourceId && { resourceId }),
    ...(projectId && { projectId }),
    ...(month ? { month } : {}),
    ...((!month && dateFrom) ? { dateFrom } : {}),
    ...((!month && dateTo) ? { dateTo } : {}),
  })

  const { data, isFetching } = useQuery({
    queryKey: ['time-entries', 'raw', resourceId, projectId, dateFrom, dateTo, month, page],
    queryFn: () => fetch(`/api/time-entries?${params}`).then((r) => r.json()),
  })

  const entries = data?.entries ?? []
  const total = data?.total ?? 0
  const totalPages = Math.ceil(total / 100)

  const totalHours = entries.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0)

  const clearFilters = () => {
    setResourceId(''); setProjectId(''); setDateFrom(''); setDateTo(''); setMonth(''); setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <select
          value={resourceId}
          onChange={(e) => { setResourceId(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Todas las personas</option>
          {resources?.map((r: { id: number; name: string }) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <select
          value={projectId}
          onChange={(e) => { setProjectId(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        >
          <option value="">Todos los proyectos</option>
          {projects?.map((p: { id: number; name: string }) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setDateFrom(''); setDateTo(''); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          placeholder="Mes"
        />
        <input
          type="date"
          value={dateFrom}
          disabled={!!month}
          onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40"
          placeholder="Desde"
        />
        <input
          type="date"
          value={dateTo}
          disabled={!!month}
          onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40"
          placeholder="Hasta"
        />
        <button
          onClick={clearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-3 py-1.5"
        >
          Limpiar filtros
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
          <span className="text-sm text-gray-600">
            {isFetching ? 'Cargando...' : `${total.toLocaleString()} registros`}
          </span>
          <span className="text-sm font-semibold text-[#0170B9]">
            Total: {formatHours(totalHours)} hs
          </span>
        </div>
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm">
            <thead className="bg-[#0170B9] text-white sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Persona</th>
                <th className="px-4 py-2 text-left">Proyecto</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-right">Horas</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: {
                id: number
                date: string
                hours: number
                resource: { name: string; color: string }
                project: { name: string; color: string }
              }) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: e.resource.color }}
                      />
                      {e.resource.name}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: e.project.color }}
                      />
                      {e.project.name}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{formatDateDisplay(e.date)}</td>
                  <td className="px-4 py-2 text-right font-medium">{formatHours(e.hours)}</td>
                </tr>
              ))}
              {entries.length === 0 && !isFetching && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    No hay datos con los filtros seleccionados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-sm px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              ← Anterior
            </button>
            <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="text-sm px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Resumen ────────────────────────────────────────────────────────────

function TabResumen() {
  const [subView, setSubView] = useState<'resource' | 'project' | 'month'>('resource')
  const [month, setMonth] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filterParams = new URLSearchParams({
    ...(month ? { month } : {}),
    ...((!month && dateFrom) ? { dateFrom } : {}),
    ...((!month && dateTo) ? { dateTo } : {}),
  })

  const { data: byResource } = useQuery<TimeEntryByResource[]>({
    queryKey: ['time-entries', 'by-resource', month, dateFrom, dateTo],
    queryFn: () => fetch(`/api/time-entries?view=by-resource&${filterParams}`).then((r) => r.json()),
  })
  const { data: byProject } = useQuery<TimeEntryByProject[]>({
    queryKey: ['time-entries', 'by-project', month, dateFrom, dateTo],
    queryFn: () => fetch(`/api/time-entries?view=by-project&${filterParams}`).then((r) => r.json()),
  })
  const { data: byMonth } = useQuery<TimeEntryByMonth[]>({
    queryKey: ['time-entries', 'by-month'],
    queryFn: () => fetch('/api/time-entries?view=by-month').then((r) => r.json()),
  })

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm text-gray-600 font-medium">Filtrar por:</span>
        <input
          type="month"
          value={month}
          onChange={(e) => { setMonth(e.target.value); setDateFrom(''); setDateTo('') }}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm"
        />
        <input
          type="date"
          value={dateFrom}
          disabled={!!month}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40"
        />
        <input
          type="date"
          value={dateTo}
          disabled={!!month}
          onChange={(e) => setDateTo(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm disabled:opacity-40"
        />
        {(month || dateFrom || dateTo) && (
          <button
            onClick={() => { setMonth(''); setDateFrom(''); setDateTo('') }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            × Limpiar
          </button>
        )}
      </div>

      {/* Sub-view tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: 'resource', label: 'Por Persona' },
          { key: 'project', label: 'Por Proyecto' },
          { key: 'month', label: 'Por Mes' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setSubView(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subView === t.key ? 'bg-white text-[#0170B9] shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tables */}
      {subView === 'resource' && (
        <SummaryTable
          data={(byResource ?? []).map((r) => ({
            label: r.resourceName,
            color: r.resourceColor,
            hours: r.totalHours,
          }))}
          label="Persona"
        />
      )}
      {subView === 'project' && (
        <SummaryTable
          data={(byProject ?? []).map((p) => ({
            label: p.projectName,
            color: p.projectColor,
            hours: p.totalHours,
          }))}
          label="Proyecto"
        />
      )}
      {subView === 'month' && (
        <SummaryTable
          data={(byMonth ?? []).map((m) => ({
            label: formatMonth(m.month),
            color: '#0170B9',
            hours: m.totalHours,
          }))}
          label="Mes"
        />
      )}
    </div>
  )
}

function SummaryTable({ data, label }: { data: { label: string; color: string; hours: number }[]; label: string }) {
  const total = data.reduce((sum, d) => sum + d.hours, 0)
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#0170B9] text-white">
          <tr>
            <th className="px-4 py-2 text-left">{label}</th>
            <th className="px-4 py-2 text-right">Horas</th>
            <th className="px-4 py-2 text-right">% del total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.label}
                </span>
              </td>
              <td className="px-4 py-2 text-right font-medium">{formatHours(row.hours)}</td>
              <td className="px-4 py-2 text-right text-gray-500">
                {total > 0 ? ((row.hours / total) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          ))}
          <tr className="border-t bg-gray-50 font-semibold">
            <td className="px-4 py-2">Total</td>
            <td className="px-4 py-2 text-right text-[#0170B9]">{formatHours(total)}</td>
            <td className="px-4 py-2 text-right">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab: Gráficos ───────────────────────────────────────────────────────────

function TabGraficos() {
  const { data: byResource } = useQuery<TimeEntryByResource[]>({
    queryKey: ['time-entries', 'by-resource-chart'],
    queryFn: () => fetch('/api/time-entries?view=by-resource').then((r) => r.json()),
  })
  const { data: byProject } = useQuery<TimeEntryByProject[]>({
    queryKey: ['time-entries', 'by-project-chart'],
    queryFn: () => fetch('/api/time-entries?view=by-project').then((r) => r.json()),
  })
  const { data: byMonth } = useQuery<TimeEntryByMonth[]>({
    queryKey: ['time-entries', 'by-month-chart'],
    queryFn: () => fetch('/api/time-entries?view=by-month').then((r) => r.json()),
  })

  const topProjects = (byProject ?? []).slice(0, 12)
  const topResources = (byResource ?? []).slice(0, 12)
  const monthData = (byMonth ?? []).map((m) => ({ ...m, name: formatMonth(m.month) }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Bar: Horas por Proyecto */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Horas por Proyecto</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topProjects} layout="vertical" margin={{ left: 120, right: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="projectName" tick={{ fontSize: 11 }} width={115} />
            <Tooltip formatter={(v) => [`${formatHours(Number(v))} hs`, 'Horas']} />
            <Bar dataKey="totalHours" radius={[0, 4, 4, 0]}>
              {topProjects.map((p, i) => (
                <Cell key={i} fill={p.projectColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bar: Horas por Persona */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Horas por Persona</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={topResources} margin={{ bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="resourceName" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${formatHours(Number(v))} hs`, 'Horas']} />
            <Bar dataKey="totalHours" radius={[4, 4, 0, 0]}>
              {topResources.map((r, i) => (
                <Cell key={i} fill={r.resourceColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line: Evolución mensual */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Evolución Mensual</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthData} margin={{ bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${formatHours(Number(v))} hs`, 'Horas']} />
            <Line
              type="monotone"
              dataKey="totalHours"
              stroke="#0170B9"
              strokeWidth={2}
              dot={{ r: 3, fill: '#0170B9' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie: Distribución por Proyecto */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Distribución por Proyecto</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={topProjects}
              dataKey="totalHours"
              nameKey="projectName"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {topProjects.map((p, i) => (
                <Cell key={i} fill={p.projectColor} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [`${formatHours(Number(v))} hs`, 'Horas']} />
            <Legend
              formatter={(value: string) => <span style={{ fontSize: 11 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type Tab = 'import' | 'table' | 'summary' | 'charts'

const TABS: { key: Tab; label: string }[] = [
  { key: 'import', label: 'Importar' },
  { key: 'table', label: 'Tabla' },
  { key: 'summary', label: 'Resumen' },
  { key: 'charts', label: 'Gráficos' },
]

export default function HoursPage() {
  const [activeTab, setActiveTab] = useState<Tab>('import')

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#3a3a3a]">Reporte de Horas</h1>
        <p className="text-sm text-gray-500 mt-1">
          Importación y consulta de horas trabajadas por persona y proyecto
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === t.key
                ? 'border-[#0170B9] text-[#0170B9]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'import' && <TabImport />}
      {activeTab === 'table' && <TabTabla />}
      {activeTab === 'summary' && <TabResumen />}
      {activeTab === 'charts' && <TabGraficos />}
    </div>
  )
}
