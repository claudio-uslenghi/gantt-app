import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'

export async function getSession() {
  return getServerSession(authOptions)
}

export function getUserRoles(session: Awaited<ReturnType<typeof getSession>>): string[] {
  return (session?.user as { roles?: string[] })?.roles ?? []
}

export async function requireAdmin() {
  const session = await getSession()
  const roles = getUserRoles(session)
  if (!roles.includes('admin')) {
    throw new Error('Forbidden')
  }
  return session!
}

export async function checkPagePermission(page: string): Promise<boolean> {
  const session = await getSession()
  if (!session) return false

  const roles = getUserRoles(session)

  // Admin always has access to everything
  if (roles.includes('admin')) return true

  if (roles.length === 0) return false

  const count = await prisma.pagePermission.count({
    where: {
      page,
      role: { name: { in: roles } },
    },
  })

  return count > 0
}
