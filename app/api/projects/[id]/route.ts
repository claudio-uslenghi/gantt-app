export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const project = await prisma.project.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name,
      color: body.color,
      status: body.status,
      priority: body.priority,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      estimatedHours: Number(body.estimatedHours),
      costPerHour: Number(body.costPerHour ?? 0),
      notes: body.notes ?? '',
    },
  })
  return NextResponse.json(project)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
