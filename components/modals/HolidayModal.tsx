'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'

const COUNTRIES = ['Argentina', 'Uruguay', 'Chile', 'Otro']

const schema = z.object({
  country: z.string().min(1),
  date: z.string().min(1),
  name: z.string().min(1),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
}

export default function HolidayModal({ open, onClose }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    // POST to import endpoint: creates CountryHoliday + syncs to resource holidays
    const res = await fetch('/api/country-holidays/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holidays: [{ country: data.country, date: data.date, name: data.name }],
      }),
    })
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ['country-holidays'] })
      qc.invalidateQueries({ queryKey: ['holidays'] })
      qc.invalidateQueries({ queryKey: ['gantt'] })
      reset()
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">Agregar Feriado</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">País *</label>
            <select {...register('country')} className="w-full border rounded px-3 py-2 text-sm">
              <option value="">Seleccionar...</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha *</label>
            <input type="date" {...register('date')} className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del feriado *</label>
            <input {...register('name')} placeholder="ej: Día de la Memoria" className="w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#0170B9] text-white rounded text-sm hover:bg-[#005a94] disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
