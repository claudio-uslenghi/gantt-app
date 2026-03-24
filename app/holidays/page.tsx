'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO, eachDayOfInterval, isWeekend } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Trash2 } from 'lucide-react'
import HolidayModal from '@/components/modals/HolidayModal'
import VacationModal from '@/components/modals/VacationModal'
import type { Holiday, Vacation } from '@/types'

const COUNTRY_FLAG: Record<string, string> = {
  Argentina: '🇦🇷', Uruguay: '🇺🇾', Chile: '🇨🇱', Otro: '🌍',
}

function fmtDate(d: string) {
  try { return format(parseISO(d), 'dd/MM/yyyy', { locale: es }) }
  catch { return d }
}

function calcWorkingDays(start: string, end: string) {
  try {
    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
    return days.filter((d) => !isWeekend(d)).length
  } catch { return '—' }
}

export default function HolidaysPage() {
  const qc = useQueryClient()
  const [showHolidayModal, setShowHolidayModal] = useState(false)
  const [showVacationModal, setShowVacationModal] = useState(false)

  const { data: holidays = [] } = useQuery<Holiday[]>({
    queryKey: ['holidays'],
    queryFn: () => fetch('/api/holidays').then((r) => r.json()),
  })
  const { data: vacations = [] } = useQuery<Vacation[]>({
    queryKey: ['vacations'],
    queryFn: () => fetch('/api/vacations').then((r) => r.json()),
  })

  const deleteHoliday = async (id: number) => {
    await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['holidays'] })
    qc.invalidateQueries({ queryKey: ['gantt'] })
  }

  const deleteVacation = async (id: number) => {
    await fetch(`/api/vacations/${id}`, { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['vacations'] })
    qc.invalidateQueries({ queryKey: ['gantt'] })
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Vacaciones & Feriados</h1>

      {/* VACATIONS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">Vacaciones programadas</h2>
          <button
            onClick={() => setShowVacationModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#0170B9] text-white rounded-lg hover:bg-[#005a94] transition-colors text-sm"
          >
            <Plus size={14} />
            Agregar vacación
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0170B9] text-white">
                <th className="px-4 py-3 text-left">Recurso</th>
                <th className="px-4 py-3 text-left">País</th>
                <th className="px-4 py-3 text-left">Desde</th>
                <th className="px-4 py-3 text-left">Hasta</th>
                <th className="px-4 py-3 text-right">Días hábiles</th>
                <th className="px-4 py-3 text-left">Notas</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vacations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-6 text-gray-400">Sin vacaciones registradas</td></tr>
              ) : vacations.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: v.resource?.color ?? '#ccc' }}
                      />
                      <span className="font-medium">{v.resource?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {COUNTRY_FLAG[v.resource?.country ?? ''] ?? '🌍'} {v.resource?.country}
                  </td>
                  <td className="px-4 py-3">{fmtDate(v.startDate)}</td>
                  <td className="px-4 py-3">{fmtDate(v.endDate)}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {calcWorkingDays(v.startDate, v.endDate)} días
                  </td>
                  <td className="px-4 py-3 text-gray-500">{v.notes || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteVacation(v.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* HOLIDAYS */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-700">Feriados no laborables</h2>
          <button
            onClick={() => setShowHolidayModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#3a3a3a] text-white rounded-lg hover:bg-[#222222] transition-colors text-sm"
          >
            <Plus size={14} />
            Agregar feriado
          </button>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0170B9] text-white">
                <th className="px-4 py-3 text-left">Recurso</th>
                <th className="px-4 py-3 text-left">País</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {holidays.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-6 text-gray-400">Sin feriados registrados</td></tr>
              ) : holidays.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: h.resource?.color ?? '#ccc' }}
                      />
                      <span className="font-medium">{h.resource?.name ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {COUNTRY_FLAG[h.resource?.country ?? ''] ?? '🌍'} {h.resource?.country}
                  </td>
                  <td className="px-4 py-3">{fmtDate(h.date)}</td>
                  <td className="px-4 py-3 text-gray-700">{h.name}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteHoliday(h.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <HolidayModal open={showHolidayModal} onClose={() => setShowHolidayModal(false)} />
      <VacationModal open={showVacationModal} onClose={() => setShowVacationModal(false)} />
    </div>
  )
}
