'use client'

import { useRef, useMemo, useState, useCallback, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { parseISO, isToday } from 'date-fns'
import GanttHeader from './GanttHeader'
import GanttRow from './GanttRow'
import UtilizationSection from './UtilizationSection'
import GanttControls from './GanttControls'
import { generateDaysInRange, computeUtilization } from '@/lib/gantt-utils'
import { DEFAULT_START, DEFAULT_END } from '@/lib/date-utils'
import type { GanttData, Assignment, Project, Resource } from '@/types'

interface Props {
  onNewAssignment: () => void
  onNewProject: () => void
  onEditAssignment: (a: Assignment & { project: Project; resource: Resource }) => void
}

async function fetchGantt(start: string, end: string): Promise<GanttData> {
  const res = await fetch(`/api/gantt?start=${start}&end=${end}`)
  if (!res.ok) throw new Error('Failed to fetch gantt data')
  return res.json()
}

export default function GanttTable({ onNewAssignment, onNewProject, onEditAssignment }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()
  const [startDate, setStartDate] = useState(DEFAULT_START)
  const [endDate, setEndDate] = useState(DEFAULT_END)
  const [selectedResources, setSelectedResources] = useState<number[]>([])
  const [selectedProjects, setSelectedProjects] = useState<number[]>([])

  const { data, isLoading, error } = useQuery({
    queryKey: ['gantt', startDate, endDate],
    queryFn: () => fetchGantt(startDate, endDate),
  })

  const days = useMemo(() => {
    try {
      return generateDaysInRange(parseISO(startDate), parseISO(endDate))
    } catch {
      return []
    }
  }, [startDate, endDate])

  const utilization = useMemo(() => {
    if (!data) return {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return computeUtilization(data.assignments as any, data.holidays, data.vacations, days)
  }, [data, days])

  const filteredAssignments = useMemo(() => {
    if (!data) return []
    return data.assignments.filter((a) => {
      if (selectedResources.length > 0 && !selectedResources.includes(a.resourceId)) return false
      if (selectedProjects.length > 0 && !selectedProjects.includes(a.projectId)) return false
      return true
    })
  }, [data, selectedResources, selectedProjects])

  const assignmentsWithMeta = useMemo(() => {
    const projectMap = new Map<number, number>()
    return filteredAssignments.map((a) => {
      const count = projectMap.get(a.projectId) ?? 0
      projectMap.set(a.projectId, count + 1)
      return { ...a, isFirstInProject: count === 0 }
    })
  }, [filteredAssignments])

  // Only show resources that have at least one visible assignment
  const resourcesInView = useMemo(() => {
    const ids = new Set(filteredAssignments.map((a) => a.resourceId))
    return data ? data.resources.filter((r) => ids.has(r.id)) : []
  }, [filteredAssignments, data])

  const handleDeleteAssignment = useCallback(async (id: number) => {
    await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
    qc.invalidateQueries({ queryKey: ['gantt'] })
  }, [qc])

  const handleScrollToday = useCallback(() => {
    if (!scrollRef.current) return
    const todayIdx = days.findIndex((d) => isToday(d))
    if (todayIdx === -1) return
    // scrollLeft = todayIdx * DAY_WIDTH positions today at the left edge of the visible day columns
    scrollRef.current.scrollLeft = todayIdx * 28
  }, [days])

  // Auto-scroll to today when data first loads
  const hasAutoScrolled = useRef(false)
  useEffect(() => {
    if (!data || hasAutoScrolled.current) return
    hasAutoScrolled.current = true
    setTimeout(handleScrollToday, 50)
  }, [data, handleScrollToday])

  const toggleResource = useCallback((id: number) => {
    setSelectedResources((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }, [])

  const toggleProject = useCallback((id: number) => {
    setSelectedProjects((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-sm animate-pulse">Cargando Gantt...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 text-sm">Error al cargar los datos del Gantt.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <GanttControls
        resources={data.resources}
        projects={data.projects}
        selectedResources={selectedResources}
        selectedProjects={selectedProjects}
        startDate={startDate}
        endDate={endDate}
        onResourceToggle={toggleResource}
        onProjectToggle={toggleProject}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
        onNewAssignment={onNewAssignment}
        onNewProject={onNewProject}
        onScrollToday={handleScrollToday}
      />

      <div className="px-4 py-1.5 text-white text-xs flex items-center gap-3" style={{ backgroundColor: '#3a3a3a' }}>
        <span className="font-bold tracking-wide">PLANIFICACIÓN DE PROYECTOS</span>
        <span className="opacity-40">|</span>
        <span className="opacity-80">Vista Diaria</span>
        <span className="opacity-40">·</span>
        <span className="opacity-80">{startDate} → {endDate}</span>
      </div>

      <div className="flex-1 overflow-auto gantt-scroll" ref={scrollRef}>
        <table
          className="gantt-table border-collapse"
          style={{ tableLayout: 'fixed', borderCollapse: 'collapse' }}
        >
          <GanttHeader days={days} />
          <tbody>
            {assignmentsWithMeta.map((assignment) => (
              <GanttRow
                key={assignment.id}
                assignment={assignment}
                days={days}
                holidays={data.holidays}
                vacations={data.vacations}
                isFirstInProject={assignment.isFirstInProject}
                onEdit={onEditAssignment}
                onDelete={handleDeleteAssignment}
              />
            ))}

            <tr style={{ height: 8 }}>
              <td colSpan={8 + days.length} style={{ backgroundColor: '#E2E8F0' }} />
            </tr>

            <UtilizationSection
              resources={resourcesInView}
              days={days}
              utilization={utilization}
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}
