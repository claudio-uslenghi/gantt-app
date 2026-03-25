export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') ?? undefined

  const holidays = await prisma.countryHoliday.findMany({
    where: country ? { country } : undefined,
    orderBy: [{ country: 'asc' }, { date: 'asc' }],
  })

  const rows = holidays.map((h: { country: string; date: Date | string; name: string }) => {
    const fecha = format(new Date(h.date), 'dd/MM/yyyy')
    // Escape commas in name
    const nombre = h.name.includes(',') ? `"${h.name}"` : h.name
    return `${h.country},${fecha},${nombre}`
  })

  const csv = ['pais,fecha,nombre', ...rows].join('\n')
  const filename = country ? `feriados-${country}.csv` : 'feriados-todos.csv'

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
