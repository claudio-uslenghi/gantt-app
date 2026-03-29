'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { PROJECT_PALETTE } from '@/types'
import type { Project } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  color: z.string().min(1),
  status: z.string().min(1),
  priority: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  estimatedHours: z.coerce.number().min(1),
  costPerHour: z.coerce.number().min(0),
  budgetHours: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  editProject?: Project | null
}

export default function ProjectModal({ open, onClose, editProject }: Props) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      color: '#2E75B6',
      status: 'En ejecución',
      priority: 'Alta',
      costPerHour: 0,
      notes: '',
    },
  })

  const selectedColor = watch('color')

  useEffect(() => {
    if (editProject) {
      reset({
        name: editProject.name,
        color: editProject.color,
        status: editProject.status,
        priority: editProject.priority,
        startDate: editProject.startDate.split('T')[0],
        endDate: editProject.endDate.split('T')[0],
        estimatedHours: editProject.estimatedHours,
        costPerHour: editProject.costPerHour,
        budgetHours: editProject.budgetHours != null ? String(editProject.budgetHours) : '',
        notes: editProject.notes,
      })
    } else {
      reset({ color: '#2E75B6', status: 'En ejecución', priority: 'Alta', costPerHour: 0, notes: '' })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProject, open])

  const onSubmit = async (data: FormData) => {
    const url = editProject ? `/api/projects/${editProject.id}` : '/api/projects'
    const method = editProject ? 'PUT' : 'POST'
    const payload = {
      ...data,
      budgetHours: data.budgetHours === '' || data.budgetHours == null ? null : Number(data.budgetHours),
    }
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ['gantt'] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">{editProject ? 'Editar' : 'Nuevo'} Proyecto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input {...register('name')} className="w-full border rounded px-3 py-2 text-sm" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-sm font-medium mb-1">Color *</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full border-4 transition-all ${
                    selectedColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                />
              ))}
            </div>
            <input type="hidden" {...register('color')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Estado *</label>
              <select {...register('status')} className="w-full border rounded px-3 py-2 text-sm">
                {['En ejecución', 'Próximo', 'En planificación', 'Continuo', 'Finalizado', 'No Facturable'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-1">Prioridad *</label>
              <select {...register('priority')} className="w-full border rounded px-3 py-2 text-sm">
                {['Alta', 'Media', 'Baja'].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha inicio *</label>
              <input type="date" {...register('startDate')} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha fin *</label>
              <input type="date" {...register('endDate')} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Horas estimadas *</label>
              <input type="number" {...register('estimatedHours')} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Costo por hora (USD)</label>
              <input type="number" step="0.01" {...register('costPerHour')} className="w-full border rounded px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Presupuesto horas facturables</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Dejar vacío = sin límite (∞)"
              {...register('budgetHours')}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Vacío = sin límite · 0 = no facturable</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas</label>
            <textarea {...register('notes')} rows={2} className="w-full border rounded px-3 py-2 text-sm" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#4472C4] text-white rounded text-sm hover:bg-[#2E75B6] disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
