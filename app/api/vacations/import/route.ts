export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

interface ImportRow {
  resourceId: number
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  halfDay: boolean
  type: string
  sourceEmail: string
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const rows: ImportRow[] = body.rows ?? []
  if (!rows.length) return NextResponse.json({ error: 'No hay filas para importar' }, { status: 400 })

  let created = 0
  let skippedExisting = 0
  let emailsBackfilled = 0

  for (const row of rows) {
    const resourceId = Number(row.resourceId)
    if (!resourceId || !row.startDate || !row.endDate) continue

    const startDate = new Date(row.startDate)
    const endDate = new Date(row.endDate)

    // Idempotency: skip if this exact (resourceId, startDate, endDate) was
    // already imported before, instead of creating a duplicate row.
    const existing = await prisma.vacation.findFirst({ where: { resourceId, startDate, endDate } })
    if (existing) {
      skippedExisting++
      continue
    }

    await prisma.vacation.create({
      data: {
        resourceId,
        startDate,
        endDate,
        halfDay: !!row.halfDay,
        type: row.type || 'Vacation / Day Off',
        notes: '',
      },
    })
    created++

    // Backfill Resource.email only when currently empty — never overwrite an
    // existing value, even if it differs from the CSV.
    if (row.sourceEmail) {
      const resource = await prisma.resource.findUnique({ where: { id: resourceId }, select: { email: true } })
      if (resource && !resource.email) {
        const emailTaken = await prisma.resource.findUnique({ where: { email: row.sourceEmail } })
        if (!emailTaken) {
          await prisma.resource.update({ where: { id: resourceId }, data: { email: row.sourceEmail } })
          emailsBackfilled++
        }
      }
    }
  }

  return NextResponse.json({ created, skippedExisting, emailsBackfilled })
}
