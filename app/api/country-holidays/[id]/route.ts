export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id)
  const { name, date } = await req.json()
  const ch = await prisma.countryHoliday.findUnique({ where: { id } })
  if (!ch) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newDate = new Date(date)
  const oldDate = ch.date

  // Update CountryHoliday using raw SQL to avoid libSQL adapter issues
  await prisma.$executeRaw`
    UPDATE "CountryHoliday" SET name = ${name}, date = ${newDate.toISOString()} WHERE id = ${id}
  `

  // Sync update to Holiday records for all resources of this country
  const resources = await prisma.resource.findMany({ where: { country: ch.country } })
  for (const resource of resources) {
    // Delete old Holiday record (by old date) and insert new one
    await prisma.$executeRaw`
      DELETE FROM "Holiday" WHERE resourceId = ${resource.id} AND date = ${oldDate.toISOString()}
    `
    await prisma.$executeRaw`
      INSERT INTO "Holiday" (resourceId, date, name)
      VALUES (${resource.id}, ${newDate.toISOString()}, ${name})
      ON CONFLICT (resourceId, date) DO UPDATE SET name = excluded.name
    `
  }

  return NextResponse.json({ ok: true })
}

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
