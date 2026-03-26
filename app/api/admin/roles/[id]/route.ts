import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEFAULT_ROLES = ['admin', 'planner', 'viewer']

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin()
    const id = parseInt(params.id)

    const role = await prisma.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    })

    if (!role) return NextResponse.json({ error: 'Rol no encontrado' }, { status: 404 })

    if (DEFAULT_ROLES.includes(role.name)) {
      return NextResponse.json({ error: 'No se pueden eliminar los roles por defecto' }, { status: 400 })
    }

    if (role._count.userRoles > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un rol que tiene usuarios asignados' },
        { status: 400 }
      )
    }

    await prisma.role.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
