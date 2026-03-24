'use client'

import React from 'react'
import { getMonth, getDate, isWeekend } from 'date-fns'
import { getDayLetter } from '@/lib/gantt-utils'

const STICKY_HEADERS = [
  { label: 'Proyecto', width: 130 },
  { label: 'Módulo / Hito', width: 195 },
  { label: 'Recurso', width: 85 },
  { label: '%', width: 44 },
  { label: 'F.Ini', width: 56 },
  { label: 'F.Fin', width: 56 },
  { label: 'H.Est', width: 52 },
  { label: 'H.Asig', width: 58 },
]

export const STICKY_OFFSETS = STICKY_HEADERS.reduce<number[]>((acc, _, i) => {
  if (i === 0) return [0]
  return [...acc, acc[i - 1] + STICKY_HEADERS[i - 1].width]
}, [])

// Row heights for top-offset calculation
const ROW_H = [28, 22, 20]
const TOP = [0, ROW_H[0], ROW_H[0] + ROW_H[1]]

interface Props {
  days: Date[]
}

export default function GanttHeader({ days }: Props) {
  // Group days by month for colspan
  type MonthGroup = { month: number; year: number; count: number }
  const monthGroups: MonthGroup[] = []
  for (const day of days) {
    const m = getMonth(day)
    const y = day.getFullYear()
    const last = monthGroups[monthGroups.length - 1]
    if (last && last.month === m && last.year === y) {
      last.count++
    } else {
      monthGroups.push({ month: m, year: y, count: 1 })
    }
  }

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  // Corner cell style: sticky both left AND top
  const cornerStyle = (i: number, rowIdx: number): React.CSSProperties => ({
    position: 'sticky',
    left: STICKY_OFFSETS[i],
    top: TOP[rowIdx],
    zIndex: 20,
    backgroundColor: '#203864',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: rowIdx === 0 ? 11 : 10,
    textAlign: 'center',
    border: '1px solid #2c3e50',
    padding: '4px 2px',
    height: ROW_H[rowIdx],
    width: STICKY_HEADERS[i].width,
    minWidth: STICKY_HEADERS[i].width,
  })

  // Alternating month background: even months lighter, odd months darker blue
  const monthBg = (monthNum: number) => monthNum % 2 === 0 ? '#4472C4' : '#2E5FA0'
  const dayNumBg = (day: Date) => isWeekend(day) ? '#D9D9D9' : getMonth(day) % 2 === 0 ? '#344D73' : '#243752'
  const dayLetBg = (day: Date) => isWeekend(day) ? '#D9D9D9' : getMonth(day) % 2 === 0 ? '#4472C4' : '#2E5FA0'

  return (
    <thead>
      {/* Row 1 — Month labels (sticky top + alternating colors) */}
      <tr>
        {STICKY_HEADERS.map((h, i) => (
          <th key={h.label} style={cornerStyle(i, 0)}>
            {i === 0 ? 'PROYECTO' : i === 1 ? 'MÓDULO / HITO' : i === 2 ? 'RECURSO' : h.label.toUpperCase()}
          </th>
        ))}
        {monthGroups.map((mg, idx) => (
          <th
            key={`${mg.year}-${mg.month}`}
            colSpan={mg.count}
            style={{
              position: 'sticky',
              top: TOP[0],
              zIndex: 8,
              backgroundColor: idx % 2 === 0 ? '#4472C4' : '#2E5FA0',
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: 11,
              textAlign: 'center',
              border: '1px solid #2c3e50',
              padding: '4px 2px',
              height: ROW_H[0],
            }}
          >
            {MONTH_NAMES[mg.month]} {mg.year}
          </th>
        ))}
      </tr>

      {/* Row 2 — Day number (sticky top + alternating shading) */}
      <tr>
        {STICKY_HEADERS.map((h, i) => (
          <th key={h.label} style={cornerStyle(i, 1)} />
        ))}
        {days.map((day) => {
          const weekend = isWeekend(day)
          const isMonthStart = getDate(day) === 1
          return (
            <th
              key={day.toISOString()}
              style={{
                position: 'sticky',
                top: TOP[1],
                zIndex: 7,
                backgroundColor: dayNumBg(day),
                color: weekend ? '#999999' : '#FFFFFF',
                fontWeight: 'bold',
                fontSize: 10,
                textAlign: 'center',
                borderTop: '1px solid #ccc',
                borderBottom: '1px solid #ccc',
                borderRight: '1px solid #ccc',
                borderLeft: isMonthStart ? '3px solid #F59E0B' : '1px solid #ccc',
                width: 28,
                minWidth: 28,
                height: ROW_H[1],
                padding: 0,
              }}
            >
              {getDate(day)}
            </th>
          )
        })}
      </tr>

      {/* Row 3 — Day letter (sticky top + alternating shading) */}
      <tr>
        {STICKY_HEADERS.map((h, i) => (
          <th key={h.label} style={cornerStyle(i, 2)} />
        ))}
        {days.map((day) => {
          const weekend = isWeekend(day)
          const isMonthStart = getDate(day) === 1
          return (
            <th
              key={day.toISOString()}
              style={{
                position: 'sticky',
                top: TOP[2],
                zIndex: 7,
                backgroundColor: dayLetBg(day),
                color: weekend ? '#BBBBBB' : '#FFFFFF',
                fontWeight: weekend ? 'normal' : 'bold',
                fontSize: 10,
                textAlign: 'center',
                borderTop: '1px solid #ccc',
                borderBottom: '1px solid #ccc',
                borderRight: '1px solid #ccc',
                borderLeft: isMonthStart ? '3px solid #F59E0B' : '1px solid #ccc',
                width: 28,
                minWidth: 28,
                height: ROW_H[2],
                padding: 0,
              }}
            >
              {getDayLetter(day)}
            </th>
          )
        })}
      </tr>
    </thead>
  )
}
