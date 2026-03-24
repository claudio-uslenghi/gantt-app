'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { CellData, Assignment, Project, Resource } from '@/types'

interface Props {
  date: Date
  cell: CellData
  assignment: Assignment & { project: Project; resource: Resource }
  isMonthStart?: boolean
  isOddMonth?: boolean
}

function GanttCellInner({ date, cell, assignment, isMonthStart, isOddMonth }: Props) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null)

  // Subtle alternating backgrounds for non-active cells
  const weekendBg   = isOddMonth ? '#CECECE' : '#D9D9D9'
  const outOfRangeBg = isOddMonth ? '#E8E8E8' : '#F2F2F2'
  const offBg        = isOddMonth ? '#B5B5B5' : '#BFBFBF'

  const styles: React.CSSProperties = {
    width: 28,
    minWidth: 28,
    maxWidth: 28,
    height: 24,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: cell.type === 'active' ? 'bold' : 'normal',
    cursor: cell.type === 'active' ? 'pointer' : 'default',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    borderRight: '1px solid #e5e7eb',
    borderLeft: isMonthStart ? '3px solid #0170B9' : '1px solid #e5e7eb',
    padding: 0,
    lineHeight: '24px',
  }

  if (cell.type === 'weekend') {
    styles.backgroundColor = weekendBg
    styles.color = '#AAAAAA'
  } else if (cell.type === 'out-of-range') {
    styles.backgroundColor = outOfRangeBg
    styles.color = 'transparent'
  } else if (cell.type === 'holiday' || cell.type === 'vacation') {
    styles.backgroundColor = offBg
    styles.color = '#666666'
  } else if (cell.type === 'active') {
    styles.backgroundColor = assignment.resource.color
    styles.color = '#FFFFFF'
  }

  const fmtHours = (h?: number) => h != null ? Number(h.toFixed(1)).toString() : ''

  const label =
    cell.type === 'active'
      ? fmtHours(cell.hours)
      : cell.type === 'holiday'
      ? 'F'
      : cell.type === 'vacation'
      ? 'V'
      : ''

  return (
    <td
      style={styles}
      onMouseEnter={(e) => {
        if (cell.type === 'active') {
          setTooltip({ x: e.clientX, y: e.clientY })
        }
      }}
      onMouseLeave={() => setTooltip(null)}
    >
      {label}
      {tooltip && cell.type === 'active' && (
        <div
          className="gantt-tooltip"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          📁 {assignment.project.name} &nbsp;|&nbsp; 👤 {assignment.resource.name} &nbsp;|&nbsp;
          📅 {format(date, 'dd/MM/yyyy', { locale: es })} &nbsp;|&nbsp; ⏱ {fmtHours(cell.hours)}h
        </div>
      )}
    </td>
  )
}

const GanttCell = React.memo(GanttCellInner)
export default GanttCell
