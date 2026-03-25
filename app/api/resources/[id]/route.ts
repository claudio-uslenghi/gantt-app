export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function syncHolidaysForResource(resourceId: number, country: string) {
  const countryHolidays = await prisma.countryHoliday.findMany({ where: { country } })
  // Replace all holidays for this resource with the country's holidays
  await prisma.holiday.deleteMany({ where: { resourceId } })
  for (const ch of countryHolidays) {
    await prisma.$executeRaw`
      INSERT INTO "Holiday" (resourceId, date, name)
      VALUES (${resourceId}, ${ch.date.toISOString()}, ${ch.name})
      ON CONFLICT (resourceId, date) DO UPDATE SET name = excluded.name
    `
  }
  return countryHolidays.length
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const body = await req.json()

  const existing = await prisma.resource.findUnique({ where: { id } })
  const countryChanged = existing && existing.country !== body.country

  const resource = await prisma.resource.update({
    where: { id },
    data: {
      name: body.name,
      country: body.country,
      color: body.color,
      capacityH: Number(body.capacityH ?? 8),
    },
  })

  if (countryChanged) {
    await syncHolidaysForResource(id, body.country)
  }

  return NextResponse.json(resource)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.resource.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
