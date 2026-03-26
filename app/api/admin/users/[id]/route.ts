import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin()
    const id = parseInt(params.id)
    const { name, email, password, active, roleIds } = await req.json()

    // Prevent deactivating yourself
    const currentUserId = (session.user as { id?: string })?.id
    if (String(id) === currentUserId && active === false) {
      return NextResponse.json({ error: 'No podés desactivarte a vos mismo' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (active !== undefined) updateData.active = active
    if (password) updateData.password = await bcrypt.hash(password, 10)

    // Update user fields
    await prisma.user.update({ where: { id }, data: updateData })

    // Update roles if provided
    if (Array.isArray(roleIds)) {
      await prisma.userRole.deleteMany({ where: { userId: id } })
      await prisma.userRole.createMany({
        data: roleIds.map((roleId: number) => ({ userId: id, roleId })),
      })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    })

    return NextResponse.json({
      id: user!.id,
      email: user!.email,
      name: user!.name,
      active: user!.active,
      roles: user!.userRoles.map((ur) => ({ id: ur.roleId, name: ur.role.name })),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdmin()
    const id = parseInt(params.id)

    const currentUserId = (session.user as { id?: string })?.id
    if (String(id) === currentUserId) {
      return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error'
    if (msg === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
