export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const assignment = await prisma.assignment.update({
    where: { id: Number(params.id) },
    data: {
      projectId: Number(body.projectId),
      resourceId: Number(body.resourceId),
      moduleName: body.moduleName,
      percentage: Number(body.percentage),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      estimatedHours: Number(body.estimatedHours),
    },
    include: { project: true, resource: true },
  })
  return NextResponse.json(assignment)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.assignment.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
