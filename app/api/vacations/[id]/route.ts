import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.vacation.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
