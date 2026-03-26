import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { userRoles: { include: { role: true } } },
        })

        if (!user || !user.active) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          roles: user.userRoles.map((ur) => ur.role.name),
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.roles = (user as { roles?: string[] }).roles ?? []
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        ;(session.user as { roles?: string[]; id?: string }).roles =
          (token.roles as string[]) ?? []
        ;(session.user as { id?: string }).id = token.id as string
      }
      return session
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
}
