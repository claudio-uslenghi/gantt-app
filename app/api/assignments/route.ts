export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const assignments = await prisma.assignment.findMany({
    include: { project: true, resource: true },
    orderBy: { startDate: 'asc' },
  })
  return NextResponse.json(assignments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const assignment = await prisma.assignment.create({
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
  return NextResponse.json(assignment, { status: 201 })
}
