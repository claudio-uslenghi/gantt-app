import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const holidays = await prisma.holiday.findMany({
    include: { resource: true },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(holidays)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Support bulk create: array of { resourceId, date, name }
  if (Array.isArray(body)) {
    const results = []
    for (const h of body) {
      try {
        const holiday = await prisma.holiday.create({
          data: {
            resourceId: Number(h.resourceId),
            date: new Date(h.date),
            name: h.name,
          },
        })
        results.push(holiday)
      } catch {
        // ignore duplicates
      }
    }
    return NextResponse.json(results, { status: 201 })
  }

  const holiday = await prisma.holiday.create({
    data: {
      resourceId: Number(body.resourceId),
      date: new Date(body.date),
      name: body.name,
    },
    include: { resource: true },
  })
  return NextResponse.json(holiday, { status: 201 })
}
