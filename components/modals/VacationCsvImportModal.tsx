'use client'

import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { Resource } from '@/types'
import { parseVacationCsv, resolveMatches, type ParsedVacationRow } from '@/lib/vacation-import'

interface Props {
  open: boolean
  onClose: () => void
}

const MATCH_STYLE: Record<'direct' | 'heuristic', string> = {
  direct: 'bg-green-100 text-green-700',
  heuristic: 'bg-blue-100 text-blue-700',
}

export default function VacationCsvImportModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<ParsedVacationRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; skippedExisting: number; emailsBackfilled: number } | null>(null)

  const { data: resources = [], isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => fetch('/api/resources').then((r) => r.json()),
    enabled: open,
  })

  if (!open) return null

  const resourceOptions = resources
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => ({ value: String(r.id), label: r.name }))

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      const uint8 = new Uint8Array(buffer)
      let text: string
      if (uint8[0] === 0xEF && uint8[1] === 0xBB && uint8[2] === 0xBF) {
        text = new TextDecoder('UTF-8').decode(uint8.slice(3))
      } else {
        const utf8 = new TextDecoder('UTF-8').decode(uint8)
        text = utf8.includes('�') ? new TextDecoder('windows-1252').decode(uint8) : utf8
      }
      const { rows: parsed, parseErrors: errs } = parseVacationCsv(text)
      const resolved = resolveMatches(parsed, resources.map((r) => ({ id: r.id, name: r.name, email: r.email })))
      setRows(resolved)
      setParseErrors(errs)
    }
    reader.readAsArrayBuffer(file)
  }

  const assignResource = (rowNumber: number, resourceId: string) => {
    setRows((prev) => prev.map((r) => (
      r.rowNumber === rowNumber
        ? { ...r, resourceId: resourceId ? Number(resourceId) : null, matchKind: resourceId ? 'manual' : 'none' }
        : r
    )))
  }

  const toggleDiscard = (rowNumber: number) => {
    setRows((prev) => prev.map((r) => (r.rowNumber === rowNumber ? { ...r, discarded: !r.discarded } : r)))
  }

  const active = rows.filter((r) => !r.discarded)
  const unresolved = active.filter((r) => !r.resourceId)
  const canImport = active.length > 0 && unresolved.length === 0

  const handleImport = async () => {
    if (!canImport) return
    setLoading(true)
    try {
      const payload = active.map((r) => ({
        resourceId: r.resourceId,
        startDate: r.startDate,
        endDate: r.endDate,
        halfDay: r.halfDay,
        type: r.type,
        sourceEmail: r.email,
      }))
      const res = await fetch('/api/vacations/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: payload }),
      })
      const data = await res.json()
      setResult(data)
      qc.invalidateQueries({ queryKey: ['vacations'] })
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['gantt'] })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFileName('')
    setRows([])
    setParseErrors([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-semibold text-gray-800">Importar Vacaciones desde CSV</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>Formato esperado:</strong> columnas Email Address, Starting, Finishing, Half Day or Full Day?,
            Type of Time off (fechas M/D/YYYY). Solo se importan filas con Starting en 2026.
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo CSV</label>
            <div
              className={`border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center transition-colors ${
                resourcesLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-[#0170B9]'
              }`}
              onClick={() => !resourcesLoading && fileRef.current?.click()}
            >
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <FileText size={18} className="text-[#0170B9]" />
                  <span className="text-sm font-medium">{fileName}</span>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload size={24} className="mx-auto mb-1" />
                  <span className="text-sm">{resourcesLoading ? 'Cargando recursos...' : 'Click para seleccionar archivo .csv'}</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} disabled={resourcesLoading} />
          </div>

          {parseErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-1 max-h-32 overflow-y-auto">
              {parseErrors.map((e, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" /> {e}
                </div>
              ))}
            </div>
          )}

          {rows.length > 0 && !result && (
            <div>
              <p className="text-sm text-gray-600 mb-2 flex flex-wrap items-center gap-1">
                <strong>{rows.length}</strong> filas de 2026 detectadas —
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                  {rows.filter((r) => r.matchKind === 'direct').length} directo
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                  {rows.filter((r) => r.matchKind === 'heuristic').length} heurístico
                </span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                  {rows.filter((r) => r.matchKind === 'manual').length} manual
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                  {unresolved.length} sin resolver
                </span>
                {rows.some((r) => r.discarded) && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                    {rows.filter((r) => r.discarded).length} descartadas
                  </span>
                )}
              </p>

              <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">Email CSV</th>
                      <th className="px-3 py-2 text-left text-gray-500">Recurso</th>
                      <th className="px-3 py-2 text-left text-gray-500">Desde</th>
                      <th className="px-3 py-2 text-left text-gray-500">Hasta</th>
                      <th className="px-3 py-2 text-left text-gray-500">Tipo</th>
                      <th className="px-3 py-2 text-center text-gray-500">½ día</th>
                      <th className="px-3 py-2 text-center text-gray-500">Descartar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.rowNumber} className={`border-t border-gray-100 ${r.discarded ? 'opacity-40' : ''}`}>
                        <td className="px-3 py-1.5">{r.email}</td>
                        <td className="px-3 py-1.5 min-w-[160px]">
                          {r.matchKind === 'direct' || r.matchKind === 'heuristic' ? (
                            <span className={`px-2 py-0.5 rounded ${MATCH_STYLE[r.matchKind]}`}>
                              {resources.find((res) => res.id === r.resourceId)?.name ?? '—'}
                            </span>
                          ) : (
                            <SearchableSelect
                              value={r.resourceId ? String(r.resourceId) : ''}
                              onChange={(v) => assignResource(r.rowNumber, v)}
                              options={resourceOptions}
                              placeholder="Asignar recurso..."
                              disabled={r.discarded}
                              className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                            />
                          )}
                        </td>
                        <td className="px-3 py-1.5 font-mono">{r.startDate}</td>
                        <td className="px-3 py-1.5 font-mono">{r.endDate}</td>
                        <td className="px-3 py-1.5">{r.type}</td>
                        <td className="px-3 py-1.5 text-center">{r.halfDay ? 'Sí' : '—'}</td>
                        <td className="px-3 py-1.5 text-center">
                          <input type="checkbox" checked={r.discarded} onChange={() => toggleDiscard(r.rowNumber)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {unresolved.length > 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Asigná un recurso a las {unresolved.length} filas sin resolver (o descartalas) para poder importar.
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">¡Importación exitosa!</p>
                <p>{result.created} vacaciones creadas</p>
                {result.skippedExisting > 0 && <p>{result.skippedExisting} ya existían (sin duplicar)</p>}
                {result.emailsBackfilled > 0 && <p>{result.emailsBackfilled} emails de recurso completados</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!canImport || loading}
              className="px-4 py-2 text-sm bg-[#0170B9] text-white rounded-lg hover:bg-[#005a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Importando...' : `Importar (${active.length})`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
