'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseISO, isWeekend, eachDayOfInterval } from 'date-fns'
import type { Project, Resource, Assignment } from '@/types'

const schema = z.object({
  projectId: z.coerce.number().min(1),
  resourceId: z.coerce.number().min(1),
  moduleName: z.string().min(1),
  percentage: z.coerce.number().min(1).max(100),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  estimatedHours: z.coerce.number().min(0),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  editAssignment?: (Assignment & { project: Project; resource: Resource }) | null
}

export default function AssignmentModal({ open, onClose, editAssignment }: Props) {
  const qc = useQueryClient()
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  })
  const { data: resources = [] } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => fetch('/api/resources').then((r) => r.json()),
  })

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { percentage: 50, estimatedHours: 0 },
  })

  const [pct, start, end] = watch(['percentage', 'startDate', 'endDate'])

  const workingDays = useMemo(() => {
    if (!start || !end) return 0
    try {
      const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
      return days.filter((d) => !isWeekend(d)).length
    } catch {
      return 0
    }
  }, [start, end])

  const previewHours = useMemo(() => {
    return Math.round(workingDays * 8 * (pct / 100))
  }, [workingDays, pct])

  useEffect(() => {
    if (!open) return
    if (editAssignment) {
      reset({
        projectId: editAssignment.projectId,
        resourceId: editAssignment.resourceId,
        moduleName: editAssignment.moduleName,
        percentage: editAssignment.percentage,
        startDate: (editAssignment.startDate as string).split('T')[0],
        endDate: (editAssignment.endDate as string).split('T')[0],
        estimatedHours: editAssignment.estimatedHours,
      })
    } else {
      reset({ percentage: 50, estimatedHours: 0 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editAssignment])

  const onSubmit = async (data: FormData) => {
    const isEdit = !!editAssignment
    const url = isEdit ? `/api/assignments/${editAssignment!.id}` : '/api/assignments'
    const method = isEdit ? 'PUT' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      qc.invalidateQueries({ queryKey: ['gantt'] })
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-bold text-lg">
            {editAssignment ? 'Editar Asignación' : 'Nueva Asignación'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">x</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proyecto *</label>
              <select {...register('projectId')} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Recurso *</label>
              <select {...register('resourceId')} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">Seleccionar...</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Modulo / Hito *</label>
            <input
              {...register('moduleName')}
              placeholder="ej: Backend / API + QA"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">% Dedicacion *</label>
            <input type="number" min="1" max="100" {...register('percentage')} className="w-full border rounded px-3 py-2 text-sm" />
            <p className="text-gray-500 text-xs mt-1">25% = 2h/dia - 50% = 4h/dia - 75% = 6h/dia - 100% = 8h/dia</p>
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

          <div>
            <label className="block text-sm font-medium mb-1">Horas estimadas *</label>
            <input type="number" {...register('estimatedHours')} className="w-full border rounded px-3 py-2 text-sm" />
            {workingDays > 0 && (
              <p className="text-blue-600 text-xs mt-1">
                aprox {previewHours}h en {workingDays} dias habiles al {pct}%
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#4472C4] text-white rounded text-sm hover:bg-[#2E75B6] disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : editAssignment ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
