import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(date: string | Date, fmt = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt, { locale: es })
}

export function formatMonth(date: Date): string {
  return format(date, 'MMMM', { locale: es })
}

export const DEFAULT_START = '2026-03-02'
export const DEFAULT_END = '2026-06-23'
