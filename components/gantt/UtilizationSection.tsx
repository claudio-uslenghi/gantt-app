'use client'

import React from 'react'
import { isWeekend, getMonth } from 'date-fns'
import { getDayLetter } from '@/lib/gantt-utils'
import type { Resource } from '@/types'
import type { DailyUtilization } from '@/lib/gantt-utils'

interface Props {
  resources: Resource[]
  days: Date[]
  utilization: DailyUtilization
}

function getCellStyle(hours: number, isWknd: boolean): React.CSSProperties {
  if (isWknd) return { backgroundColor: '#D9D9D9', color: '#AAAAAA' }
  if (hours === 0) return { backgroundColor: '#FFFFFF', color: '#000' }
  if (hours > 8) return { backgroundColor: '#FF0000', color: '#FFFFFF', fontWeight: 'bold' }
  if (hours === 8) return { backgroundColor: '#F4B942', color: '#000000', fontWeight: 'bold' }
  return { backgroundColor: '#C6EFCE', color: '#006100' }
}

export default function UtilizationSection({ resources, days, utilization }: Props) {
  return (
    <>
      {/* Section header */}
      <tr>
        <td
          colSpan={8 + days.length}
          style={{
            backgroundColor: '#203864',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 12,
            padding: '6px 12px',
            letterSpacing: '0.05em',
          }}
        >
          CONTROL DE SOBRECARGA POR RECURSO (máx. 8 h/día)
        </td>
      </tr>

      {/* Sub-header: day letters */}
      <tr>
        {/* Sticky left area */}
        <td
          colSpan={8}
          style={{
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: '#344D73',
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 11,
            textAlign: 'center',
            border: '1px solid #2c3e50',
            padding: '3px 8px',
          }}
        >
          Recurso
        </td>
        {days.map((day) => {
          const weekend = isWeekend(day)
          const isMonthStart = day.getDate() === 1
          const isOddMonth = getMonth(day) % 2 === 1
          const dayBg = weekend ? '#D9D9D9' : isOddMonth ? '#2E5FA0' : '#4472C4'
          return (
            <td
              key={day.toISOString()}
              style={{
                backgroundColor: dayBg,
                color: weekend ? '#999999' : '#FFFFFF',
                fontWeight: weekend ? 'normal' : 'bold',
                fontSize: 10,
                textAlign: 'center',
                borderTop: '1px solid #ccc',
                borderBottom: '1px solid #ccc',
                borderRight: '1px solid #ccc',
                borderLeft: isMonthStart ? '3px solid #F59E0B' : '1px solid #ccc',
                width: 28,
                minWidth: 28,
                height: 20,
                padding: 0,
              }}
            >
              {getDayLetter(day)}
            </td>
          )
        })}
      </tr>

      {/* One row per resource */}
      {resources.map((resource) => {
        const resUtil = utilization[resource.id] ?? {}
        return (
          <tr key={resource.id}>
            <td
              colSpan={8}
              style={{
                position: 'sticky',
                left: 0,
                zIndex: 5,
                backgroundColor: '#F0F4FF',
                borderRight: '1px solid #d1d5db',
                borderBottom: '1px solid #e5e7eb',
                fontSize: 11,
                fontWeight: 'bold',
                padding: '2px 8px',
              }}
            >
              <span style={{ color: resource.color }}>●</span> {resource.name}
            </td>
            {days.map((day) => {
              const key = day.toISOString().split('T')[0]
              const hours = resUtil[key] ?? 0
              const weekend = isWeekend(day)
              const isMonthStart = day.getDate() === 1
              const isOddMonth = getMonth(day) % 2 === 1
              const cellStyle = getCellStyle(hours, weekend)
              // Apply subtle alternating tint for zero-hours cells
              const bg = cellStyle.backgroundColor as string
              const oddTint = isOddMonth && hours === 0 && !weekend ? '#F0F0F0' : bg
              return (
                <td
                  key={day.toISOString()}
                  style={{
                    ...cellStyle,
                    backgroundColor: hours === 0 && !weekend ? oddTint : bg,
                    width: 28,
                    minWidth: 28,
                    height: 24,
                    fontSize: 10,
                    textAlign: 'center',
                    borderTop: '1px solid #e5e7eb',
                    borderBottom: '1px solid #e5e7eb',
                    borderRight: '1px solid #e5e7eb',
                    borderLeft: isMonthStart ? '3px solid #F59E0B' : '1px solid #e5e7eb',
                    padding: 0,
                    lineHeight: '24px',
                  }}
                  title={!weekend && hours > 0 ? `${resource.name}: ${hours}h` : undefined}
                >
                  {!weekend && hours > 0 ? hours : ''}
                </td>
              )
            })}
          </tr>
        )
      })}

      {/* Legend */}
      <tr>
        <td
          colSpan={8 + days.length}
          style={{
            padding: '8px 12px',
            backgroundColor: '#F8FAFC',
            borderTop: '2px solid #E2E8F0',
            fontSize: 11,
            color: '#555',
          }}
        >
          <span style={{ marginRight: 16 }}>
            🔴 {'>'} 8h → <strong>SOBRECARGA</strong>
          </span>
          <span style={{ marginRight: 16 }}>
            🟠 = 8h → <strong>TOPE EXACTO</strong>
          </span>
          <span style={{ marginRight: 16 }}>
            🟢 {'<'} 8h → <strong>OK</strong>
          </span>
          <span>
            ⬜ V = Vacaciones | F = Feriado
          </span>
        </td>
      </tr>
    </>
  )
}
