export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const roles = (session?.user as { roles?: string[] })?.roles ?? []
  return roles.includes('admin')
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  try {
    const entry = await prisma.timeEntry.update({
      where: { id: Number(params.id) },
      data: {
        ...(body.hours    !== undefined && { hours:      Number(body.hours) }),
        ...(body.date     !== undefined && { date:       new Date(body.date) }),
        ...(body.projectId  !== undefined && { projectId:  Number(body.projectId) }),
        ...(body.resourceId !== undefined && { resourceId: Number(body.resourceId) }),
      },
      include: { resource: { select: { id: true, name: true, color: true } }, project: { select: { id: true, name: true, color: true } } },
    })
    return NextResponse.json(entry)
  } catch {
    return NextResponse.json({ error: 'Conflict or not found' }, { status: 409 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.timeEntry.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
