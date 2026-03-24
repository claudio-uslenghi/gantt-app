import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeUtilization, generateDaysInRange } from '@/lib/gantt-utils'
import { DEFAULT_START, DEFAULT_END } from '@/lib/date-utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const start = new Date(searchParams.get('start') ?? DEFAULT_START)
  const end = new Date(searchParams.get('end') ?? DEFAULT_END)

  const [assignments, holidays, vacations] = await Promise.all([
    prisma.assignment.findMany({ include: { project: true } }),
    prisma.holiday.findMany(),
    prisma.vacation.findMany(),
  ])

  const days = generateDaysInRange(start, end)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const utilization = computeUtilization(assignments as any, holidays as any, vacations as any, days)

  return NextResponse.json(utilization)
}
