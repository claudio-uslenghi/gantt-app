import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      include: { userRoles: { include: { role: true } } },
    })
    return NextResponse.json(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        active: u.active,
        createdAt: u.createdAt,
        roles: u.userRoles.map((ur) => ({ id: ur.roleId, name: ur.role.name })),
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const { email, password, name, roleIds } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        userRoles: {
          create: (roleIds ?? []).map((roleId: number) => ({ roleId })),
        },
      },
      include: { userRoles: { include: { role: true } } },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      active: user.active,
      roles: user.userRoles.map((ur) => ({ id: ur.roleId, name: ur.role.name })),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (msg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
