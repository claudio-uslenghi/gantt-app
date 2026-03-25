'use client'

import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'

interface ParsedRow { country: string; date: string; name: string }

interface Props {
  open: boolean
  onClose: () => void
}

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (!lines.length) return { rows: [], errors: ['Archivo vacío'] }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim().replace(/"/g, ''))
  const colPais = header.findIndex((h) => h === 'pais' || h === 'país' || h === 'country')
  const colFecha = header.findIndex((h) => h === 'fecha' || h === 'date')
  const colNombre = header.findIndex((h) => h === 'nombre' || h === 'name')

  if (colPais === -1 || colFecha === -1 || colNombre === -1) {
    return { rows: [], errors: ['El CSV debe tener columnas: pais, fecha, nombre'] }
  }

  const rows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/"/g, ''))
    if (cols.length < 3) continue
    const country = cols[colPais]
    const date = cols[colFecha]
    const name = cols[colNombre]
    if (!country || !date || !name) {
      errors.push(`Fila ${i + 1}: datos incompletos`)
      continue
    }
    rows.push({ country, date, name })
  }

  return { rows, errors }
}

export default function CsvImportModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [parsed, setParsed] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ totalCountryHolidays: number; totalResourceHolidays: number } | null>(null)

  if (!open) return null

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const { rows, errors } = parseCSV(text)
      setParsed(rows)
      setParseErrors(errors)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    if (!parsed.length) return
    setLoading(true)
    try {
      const res = await fetch('/api/country-holidays/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holidays: parsed }),
      })
      const data = await res.json()
      setResult(data)
      qc.invalidateQueries({ queryKey: ['country-holidays'] })
      qc.invalidateQueries({ queryKey: ['holidays'] })
      qc.invalidateQueries({ queryKey: ['gantt'] })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setParsed([])
    setParseErrors([])
    setFileName('')
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
    onClose()
  }

  // Count by country for summary
  const byCountry = parsed.reduce<Record<string, number>>((acc, r) => {
    acc[r.country] = (acc[r.country] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Importar Feriados desde CSV</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Format hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-xs text-blue-700">
            <strong>Formato CSV requerido:</strong>
            <pre className="mt-1 font-mono">pais,fecha,nombre{'\n'}Argentina,01/01/2026,Año Nuevo{'\n'}Uruguay,01/01/2026,Año Nuevo</pre>
          </div>

          {/* File input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo CSV</label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-6 text-center cursor-pointer hover:border-[#0170B9] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {fileName ? (
                <div className="flex items-center justify-center gap-2 text-gray-700">
                  <FileText size={18} className="text-[#0170B9]" />
                  <span className="text-sm font-medium">{fileName}</span>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload size={24} className="mx-auto mb-1" />
                  <span className="text-sm">Click para seleccionar archivo .csv</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {parseErrors.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-red-700">
                  <AlertCircle size={12} /> {e}
                </div>
              ))}
            </div>
          )}

          {/* Preview */}
          {parsed.length > 0 && !result && (
            <div>
              <p className="text-sm text-gray-600 mb-2">
                <strong>{parsed.length}</strong> feriados detectados:
                {Object.entries(byCountry).map(([c, n]) => (
                  <span key={c} className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs">{c}: {n}</span>
                ))}
              </p>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg text-xs">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-500">País</th>
                      <th className="px-3 py-2 text-left text-gray-500">Fecha</th>
                      <th className="px-3 py-2 text-left text-gray-500">Nombre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.slice(0, 10).map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5">{r.country}</td>
                        <td className="px-3 py-1.5 font-mono">{r.date}</td>
                        <td className="px-3 py-1.5">{r.name}</td>
                      </tr>
                    ))}
                    {parsed.length > 10 && (
                      <tr className="border-t border-gray-100 bg-gray-50">
                        <td colSpan={3} className="px-3 py-1.5 text-center text-gray-400">
                          … y {parsed.length - 10} más
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium">¡Importación exitosa!</p>
                <p>{result.totalCountryHolidays} feriados de país actualizados</p>
                <p>{result.totalResourceHolidays} asignaciones a recursos realizadas</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={handleClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            {result ? 'Cerrar' : 'Cancelar'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!parsed.length || loading}
              className="px-4 py-2 text-sm bg-[#0170B9] text-white rounded-lg hover:bg-[#005a94] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Importando...' : `Importar ${parsed.length ? `(${parsed.length})` : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
