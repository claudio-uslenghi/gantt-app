import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const vacations = await prisma.vacation.findMany({
    include: { resource: true },
    orderBy: { startDate: 'asc' },
  })
  return NextResponse.json(vacations)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const vacation = await prisma.vacation.create({
    data: {
      resourceId: Number(body.resourceId),
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      notes: body.notes ?? '',
    },
    include: { resource: true },
  })
  return NextResponse.json(vacation, { status: 201 })
}
