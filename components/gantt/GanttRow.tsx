'use client'

import React, { useState, useMemo } from 'react'
import { format, parseISO, getMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import GanttCell from './GanttCell'
import { STICKY_OFFSETS } from './GanttHeader'
import { getCellData } from '@/lib/gantt-utils'
import { STATUS_COLORS } from '@/types'
import type { Assignment, Project, Resource, Holiday, Vacation } from '@/types'

interface Props {
  assignment: Assignment & { project: Project; resource: Resource }
  days: Date[]
  holidays: Holiday[]
  vacations: Vacation[]
  isFirstInProject: boolean
  projectRowCount?: number
  onEdit: (a: Assignment & { project: Project; resource: Resource }) => void
  onDelete: (id: number) => void
}

const STICKY_WIDTHS = [130, 195, 85, 44, 56, 56, 52, 58]

function GanttRowInner({
  assignment,
  days,
  holidays,
  vacations,
  isFirstInProject,
  onEdit,
  onDelete,
}: Props) {
  const [hovered, setHovered] = useState(false)
  const project = assignment.project
  const resource = assignment.resource
  const statusColor = STATUS_COLORS[project.status] ?? '#F7F7F7'

  // Sum of actual assigned hours across all active cells in this row
  const assignedHours = useMemo(() => {
    let total = 0
    for (const day of days) {
      const cell = getCellData(day, assignment, holidays, vacations)
      if (cell.type === 'active') total += cell.hours ?? 0
    }
    return Math.round(total * 10) / 10
  }, [days, assignment, holidays, vacations])

  const hAsigColor = (() => {
    if (assignedHours === 0) return '#9CA3AF'
    if (assignedHours > assignment.estimatedHours) return '#EF4444'
    if (assignedHours === assignment.estimatedHours) return '#D97706'
    return '#16A34A'
  })()

  const stickyCell = (
    content: React.ReactNode,
    idx: number,
    extra: React.CSSProperties = {}
  ) => (
    <td
      style={{
        position: 'sticky',
        left: STICKY_OFFSETS[idx],
        width: STICKY_WIDTHS[idx],
        minWidth: STICKY_WIDTHS[idx],
        zIndex: 5,
        backgroundColor: idx === 0 ? statusColor : hovered ? '#EEF2FF' : '#F7F7F7',
        borderRight: '1px solid #d1d5db',
        borderBottom: '1px solid #e5e7eb',
        fontSize: 11,
        padding: '2px 4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        transition: 'background-color 0.1s',
        ...extra,
      }}
    >
      {content}
    </td>
  )

  const fmtDate = (d: string) => {
    try {
      return format(parseISO(d), 'dd/MM', { locale: es })
    } catch {
      return d
    }
  }

  return (
    <tr
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ backgroundColor: hovered ? '#F5F7FF' : 'transparent' }}
    >
      {/* Project name — only on first row of group */}
      {stickyCell(
        isFirstInProject ? (
          <span className="font-semibold text-xs" title={project.name}>
            {project.name}
          </span>
        ) : null,
        0,
        { backgroundColor: statusColor }
      )}

      {/* Module */}
      {stickyCell(
        <span className="text-xs" title={assignment.moduleName}>
          {assignment.moduleName}
        </span>,
        1
      )}

      {/* Resource */}
      {stickyCell(
        <span
          className="text-xs font-medium"
          style={{ color: resource.color }}
          title={resource.name}
        >
          {resource.name}
        </span>,
        2
      )}

      {/* % */}
      {stickyCell(
        <span className="text-xs text-center block">{assignment.percentage}%</span>,
        3
      )}

      {/* Start */}
      {stickyCell(
        <span className="text-xs">{fmtDate(assignment.startDate as string)}</span>,
        4
      )}

      {/* End */}
      {stickyCell(
        <span className="text-xs">{fmtDate(assignment.endDate as string)}</span>,
        5
      )}

      {/* H.Est + action buttons on hover */}
      {stickyCell(
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs">{assignment.estimatedHours}h</span>
          {hovered && (
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(assignment) }}
                title="Editar asignación"
                className="p-0.5 rounded text-blue-500 hover:bg-blue-100 transition-colors"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`¿Eliminar la asignacion de ${resource.name} en ${project.name}?`)) {
                    onDelete(assignment.id)
                  }
                }}
                title="Eliminar asignación"
                className="p-0.5 rounded text-red-400 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>,
        6,
        { overflow: 'visible' }
      )}

      {/* H.Asig — sum of assigned hours in this row */}
      {stickyCell(
        <span
          className="text-xs font-semibold block text-center"
          style={{ color: hAsigColor }}
          title={`Horas asignadas: ${assignedHours}h / Estimadas: ${assignment.estimatedHours}h`}
        >
          {assignedHours}h
        </span>,
        7
      )}

      {/* Day cells */}
      {days.map((day) => {
        const cell = getCellData(day, assignment, holidays, vacations)
        return (
          <GanttCell
            key={day.toISOString()}
            date={day}
            cell={cell}
            assignment={assignment}
            isMonthStart={day.getDate() === 1}
            isOddMonth={getMonth(day) % 2 === 1}
          />
        )
      })}
    </tr>
  )
}

const GanttRow = React.memo(GanttRowInner)
export default GanttRow
