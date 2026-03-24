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
        'h-screen text-white flex flex-col transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-52'
      )}
      style={{ backgroundColor: '#0170B9' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight text-white tracking-wide">
              Planificación
            </span>
            <span className="text-xs text-white/70 leading-tight">de Proyectos</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="ml-auto text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-2 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-all duration-150',
                isActive
                  ? 'bg-white/25 text-white font-semibold shadow-sm'
                  : 'text-white/75 hover:bg-white/15 hover:text-white'
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/20 text-xs text-white/40 text-center">
        {!collapsed && (
          <span className="font-medium tracking-wide">ZIRCON · 2026</span>
        )}
      </div>
    </aside>
  )
}
