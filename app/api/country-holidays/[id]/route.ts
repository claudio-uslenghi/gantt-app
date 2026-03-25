export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const ch = await prisma.countryHoliday.findUnique({ where: { id } })
  if (!ch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Cascade delete: remove from all resources of this country
  const resources = await prisma.resource.findMany({ where: { country: ch.country } })
  await prisma.holiday.deleteMany({
    where: {
      resourceId: { in: resources.map((r) => r.id) },
      date: ch.date,
    },
  })

  await prisma.countryHoliday.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
