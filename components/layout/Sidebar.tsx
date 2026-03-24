'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, FolderKanban, Users, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/gantt', icon: BarChart3, label: 'Gantt' },
  { href: '/projects', icon: FolderKanban, label: 'Proyectos' },
  { href: '/resources', icon: Users, label: 'Recursos' },
  { href: '/holidays', icon: CalendarDays, label: 'Feriados & Vacaciones' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        'h-screen bg-[#203864] text-white flex flex-col transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-52'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        {!collapsed && (
          <span className="font-bold text-sm leading-tight text-white/90">
            Planificación<br />de Proyectos
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto text-white/60 hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 p-2 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/60 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10 text-xs text-white/30 text-center">
        {!collapsed && 'v1.0 · 2026'}
      </div>
    </aside>
  )
}
