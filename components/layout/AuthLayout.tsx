'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'

const NO_SIDEBAR_PATHS = ['/login', '/unauthorized']

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = !NO_SIDEBAR_PATHS.some((p) => pathname.startsWith(p))

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
