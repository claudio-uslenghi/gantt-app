export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const resource = await prisma.resource.update({
    where: { id: Number(params.id) },
    data: {
      name: body.name,
      country: body.country,
      color: body.color,
      capacityH: Number(body.capacityH ?? 8),
    },
  })
  return NextResponse.json(resource)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.resource.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
