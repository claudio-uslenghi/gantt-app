'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import type { Resource } from '@/types'

const schema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  color: z.string().min(1),
  capacityH: z.coerce.number().min(1).max(24),
})

type FormData = z.infer<typeof schema>

// National holidays for auto-load
const HOLIDAY_PRESETS: Record<string, { date: string; name: string }[]> = {
  Argentina: [
    { date: '2026-03-24', name: 'Día de la Memoria' },
    { date: '2026-04-02', name: 'Día del Veterano' },
    { date: '2026-04-03', name: 'Viernes Santo' },
    { date: '2026-05-01', name: 'Día del Trabajador' },
    { date: '2026-05-25', name: 'Revolución de Mayo' },
    { date: '2026-06-15', name: 'Paso a la Inmortalidad Gral. Güemes' },
  ],
  Uruguay: [
    { date: '2026-04-02', name: 'Semana Santa' },
    { date: '2026-04-03', name: 'Semana Santa' },
    { date: '2026-05-01', name: 'Día de los Trabajadores' },
  ],
  Chile: [
    { date: '2026-04-03', name: 'Viernes Santo' },
    { date: '2026-05-01', name: 'Día del Trabajador' },
    { date: '2026-05-21', name: 'Día de las Glorias Navales' },
  ],
}

interface Props {
  open: boolean
  onClose: () => void
  editResource?: Resource | null
}

export default function ResourceModal({ open, onClose, editResource }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { color: '#4472C4', capacityH: 8, country: 'Argentina' },
  })

  const country = watch('country')

  useEffect(() => {
    if (editResource) {
      reset({
        name: editResource.name,
        country: editResource.country,
        color: editResource.color,
        capacityH: editResource.capacityH,
      })
    } else {
      reset({ color: '#4472C4', capacityH: 8, country: 'Argentina' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editResource, open])

  const onSubmit = async (data: FormData) => {
    const url = editResource ? `/api/resources/${editResource.id}` : '/api/resources'
    const method = editResource ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) {
      await res.json()
      qc.invalidateQueries({ queryKey: ['resources'] })
      qc.invalidateQueries({ queryKey: ['gantt'] })
      onClose()
    }
  }

  const loadHolidays = async () => {
    const presets = HOLIDAY_PRESETS[country]
    if (!presets || !editResource) return
    const body = presets.map((h) => ({ resourceId: editResource.id, date: h.date, name: h.name }))
    await fetch('/api/holidays', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    qc.invalidateQueries({ queryKey: ['gantt'] })
    qc.invalidateQueries({ queryKey: ['holidays'] })
    alert(`${presets.length} feriados cargados para ${country}`)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">{editResource ? 'Editar' : 'Nuevo'} Recurso</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input {...register('name')} className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">País *</label>
            <select {...register('country')} className="w-full border rounded px-3 py-2 text-sm">
              {['Argentina', 'Uruguay', 'Chile', 'Otro'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input type="color" {...register('color')} className="w-16 h-10 border rounded cursor-pointer" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Capacidad (h/día)</label>
            <input type="number" min="1" max="24" {...register('capacityH')} className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          {editResource && HOLIDAY_PRESETS[country] && (
            <button
              type="button"
              onClick={loadHolidays}
              className="w-full text-sm px-3 py-2 bg-amber-50 border border-amber-300 text-amber-700 rounded hover:bg-amber-100"
            >
              📅 Cargar feriados 2026 de {country}
            </button>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#4472C4] text-white rounded text-sm hover:bg-[#2E75B6] disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
