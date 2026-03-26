import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const DEFAULT_ROLES = ['admin', 'planner', 'viewer']

export async function GET() {
  try {
    await requireAdmin()
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { userRoles: true } } },
    })
    return NextResponse.json(
      roles.map((r) => ({
        id: r.id,
        name: r.name,
        userCount: r._count.userRoles,
        isDefault: DEFAULT_ROLES.includes(r.name),
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { name } = await req.json()

    if (!name?.trim()) {
      return NextResponse.json({ error: 'El nombre del rol es requerido' }, { status: 400 })
    }

    const role = await prisma.role.create({ data: { name: name.trim().toLowerCase() } })
    return NextResponse.json({ id: role.id, name: role.name, userCount: 0, isDefault: false })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Ya existe un rol con ese nombre' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
