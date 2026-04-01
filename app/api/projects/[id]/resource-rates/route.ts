export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const rates = await prisma.projectResourceRate.findMany({
    where: { projectId: Number(params.id) },
    include: { resource: { select: { id: true, name: true, color: true } } },
    orderBy: { profile: 'asc' },
  })
  return NextResponse.json(rates)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = Number(params.id)
  const rates: { resourceId: number; profile: string; ratePerHour: number; billable: boolean }[] = await req.json()

  await prisma.projectResourceRate.deleteMany({ where: { projectId } })

  if (rates.length > 0) {
    await prisma.projectResourceRate.createMany({
      data: rates.map((r) => ({
        projectId,
        resourceId: Number(r.resourceId),
        profile: r.profile ?? 'Developer',
        ratePerHour: Number(r.ratePerHour ?? 0),
        billable: r.billable !== false,
      })),
    })
  }

  return NextResponse.json({ ok: true })
}
