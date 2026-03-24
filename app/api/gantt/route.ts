export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [assignments, holidays, vacations, resources, projects] = await Promise.all([
    prisma.assignment.findMany({
      include: { project: true, resource: true },
      orderBy: [{ project: { name: 'asc' } }, { startDate: 'asc' }],
    }),
    prisma.holiday.findMany(),
    prisma.vacation.findMany(),
    prisma.resource.findMany({ orderBy: { name: 'asc' } }),
    prisma.project.findMany({ orderBy: { startDate: 'asc' } }),
  ])

  return NextResponse.json({ assignments, holidays, vacations, resources, projects })
}
