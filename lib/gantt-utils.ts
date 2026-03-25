import {
  isWeekend,
  isWithinInterval,
  isSameDay,
  parseISO,
  eachDayOfInterval,
  isMonday,
  isTuesday,
  isWednesday,
  isThursday,
  isFriday,
} from 'date-fns'
import type { Assignment, Holiday, Vacation, CellData } from '@/types'

export function getCellData(
  date: Date,
  assignment: Assignment & { project: { color: string } },
  holidays: Holiday[],
  vacations: Vacation[]
): CellData {
  if (isWeekend(date)) return { type: 'weekend' }

  const start = typeof assignment.startDate === 'string' ? parseISO(assignment.startDate) : assignment.startDate as unknown as Date
  const end = typeof assignment.endDate === 'string' ? parseISO(assignment.endDate) : assignment.endDate as unknown as Date

  if (!isWithinInterval(date, { start, end })) return { type: 'out-of-range' }

  // Compare using date-part only to avoid UTC timezone offset shifting the day.
  // For the cell date (local Date), use local year/month/day.
  // For the holiday date (ISO string from DB), take the first 10 chars (YYYY-MM-DD).
  const toDateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const cellKey = toDateKey(date)
  const isHoliday = holidays.some(
    (h) =>
      h.resourceId === assignment.resourceId &&
      (typeof h.date === 'string' ? h.date : (h.date as unknown as Date).toISOString()).substring(0, 10) === cellKey
  )
  if (isHoliday) return { type: 'holiday', label: 'F' }

  const isVacation = vacations.some((v) => {
    if (v.resourceId !== assignment.resourceId) return false
    const vs = typeof v.startDate === 'string' ? parseISO(v.startDate) : v.startDate as unknown as Date
    const ve = typeof v.endDate === 'string' ? parseISO(v.endDate) : v.endDate as unknown as Date
    return isWithinInterval(date, { start: vs, end: ve })
  })
  if (isVacation) return { type: 'vacation', label: 'V' }

  const hours = Math.round((8 * assignment.percentage) / 100 * 10) / 10
  return { type: 'active', hours }
}

export function getDayLetter(date: Date): string {
  if (isMonday(date)) return 'L'
  if (isTuesday(date)) return 'M'
  if (isWednesday(date)) return 'X'
  if (isThursday(date)) return 'J'
  if (isFriday(date)) return 'V'
  const day = date.getDay()
  if (day === 6) return 'S'
  return 'D'
}

export function generateDaysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end })
}

export function countWorkingDays(start: Date, end: Date, holidays: Date[] = []): number {
  const days = eachDayOfInterval({ start, end })
  return days.filter((d) => {
    if (isWeekend(d)) return false
    if (holidays.some((h) => isSameDay(h, d))) return false
    return true
  }).length
}

export type DailyUtilization = Record<number, Record<string, number>>

export function computeUtilization(
  assignments: (Assignment & { project: { color: string } })[],
  holidays: Holiday[],
  vacations: Vacation[],
  days: Date[]
): DailyUtilization {
  const result: DailyUtilization = {}

  for (const assignment of assignments) {
    if (!result[assignment.resourceId]) result[assignment.resourceId] = {}

    for (const day of days) {
      const cell = getCellData(day, assignment, holidays, vacations)
      if (cell.type === 'active' && cell.hours) {
        const key = day.toISOString().split('T')[0]
        result[assignment.resourceId][key] = (result[assignment.resourceId][key] ?? 0) + cell.hours
      }
    }
  }

  return result
}
