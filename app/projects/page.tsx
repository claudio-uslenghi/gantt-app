'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { es } from 'date-fns/locale'
import ProjectModal from '@/components/modals/ProjectModal'
import type { Project } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  'En ejecución': '#C6EFCE',
  'Próximo': '#FFEB9C',
  'En planificación': '#FFC7CE',
  'Continuo': '#FCE4D6',
  'Finalizado': '#E0E0E0',
}

const PRIORITY_COLORS: Record<string, string> = {
  Alta: '#C00000',
  Media: '#BF8F00',
  Baja: '#375623',
}

export default function ProjectsPage() {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then((r) => r.json()),
  })

  const deleteProject = async (id: number) => {
    if (!confirm('¿Eliminar este proyecto y todas sus asignaciones?')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['projects'] })
    qc.invalidateQueries({ queryKey: ['gantt'] })
  }

  const fmtDate = (d: string) => {
    try { return format(parseISO(d), 'dd/MM/yyyy', { locale: es }) }
    catch { return d }
  }

  const totalHours = projects.reduce((s, p) => s + p.estimatedHours, 0)
  const totalCost = projects.reduce((s, p) => s + p.estimatedHours * p.costPerHour, 0)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Cartera de Proyectos</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} proyectos registrados</p>
        </div>
        <button
          onClick={() => { setEditProject(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#0170B9] text-white rounded-lg hover:bg-[#005a94] transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Nuevo Proyecto
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 py-12">Cargando proyectos...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0170B9] text-white">
                  <th className="px-4 py-3 text-left">Proyecto</th>
                  <th className="px-4 py-3 text-left">Estado</th>
                  <th className="px-4 py-3 text-left">Prioridad</th>
                  <th className="px-4 py-3 text-left">F.Inicio</th>
                  <th className="px-4 py-3 text-left">F.Fin</th>
                  <th className="px-4 py-3 text-right">H.Est.</th>
                  <th className="px-4 py-3 text-right">$/h</th>
                  <th className="px-4 py-3 text-right">Costo Total</th>
                  <th className="px-4 py-3 text-left">Notas</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: STATUS_COLORS[p.status] ?? '#eee' }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs font-bold"
                        style={{ color: PRIORITY_COLORS[p.priority] ?? '#333' }}
                      >
                        {p.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(p.startDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{fmtDate(p.endDate)}</td>
                    <td className="px-4 py-3 text-right font-medium">{p.estimatedHours}h</td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {p.costPerHour > 0 ? `$${p.costPerHour}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {p.costPerHour > 0
                        ? `$${(p.estimatedHours * p.costPerHour).toLocaleString()}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate" title={p.notes}>
                      {p.notes || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setEditProject(p); setShowModal(true) }}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteProject(p.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                  <td colSpan={5} className="px-4 py-3 text-gray-600">TOTALES</td>
                  <td className="px-4 py-3 text-right">{totalHours}h</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-right">${totalCost.toLocaleString()}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <ProjectModal
        open={showModal}
        editProject={editProject}
        onClose={() => { setShowModal(false); setEditProject(null) }}
      />
    </div>
  )
}
