export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const resources = await prisma.resource.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(resources)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const resource = await prisma.resource.create({
    data: {
      name: body.name,
      country: body.country,
      color: body.color ?? '#4472C4',
      capacityH: Number(body.capacityH ?? 8),
    },
  })
  return NextResponse.json(resource, { status: 201 })
}
