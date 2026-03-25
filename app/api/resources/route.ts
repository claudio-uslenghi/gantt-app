export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const resources = await prisma.resource.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(resources)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const resource = await prisma.resource.create({
    data: {
      name: body.name,
      country: body.country,
      color: body.color ?? '#4472C4',
      capacityH: Number(body.capacityH ?? 8),
    },
  })

  // Auto-assign country holidays to the new resource
  const countryHolidays = await prisma.countryHoliday.findMany({
    where: { country: resource.country },
  })
  for (const ch of countryHolidays) {
    await prisma.$executeRaw`
      INSERT INTO "Holiday" (resourceId, date, name)
      VALUES (${resource.id}, ${ch.date.toISOString()}, ${ch.name})
      ON CONFLICT (resourceId, date) DO UPDATE SET name = excluded.name
    `
  }

  return NextResponse.json(resource, { status: 201 })
}
