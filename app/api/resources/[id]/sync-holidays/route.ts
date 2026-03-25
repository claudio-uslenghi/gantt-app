export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const { country } = await req.json()
  if (!country) return NextResponse.json({ error: 'country required' }, { status: 400 })

  const countryHolidays = await prisma.countryHoliday.findMany({ where: { country } })
  // Replace all holidays for this resource with the country's holidays
  await prisma.holiday.deleteMany({ where: { resourceId: id } })
  for (const ch of countryHolidays) {
    await prisma.$executeRaw`
      INSERT INTO "Holiday" (resourceId, date, name)
      VALUES (${id}, ${ch.date.toISOString()}, ${ch.name})
      ON CONFLICT (resourceId, date) DO UPDATE SET name = excluded.name
    `
  }

  return NextResponse.json({ synced: countryHolidays.length })
}
