'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, CalendarDays, ChevronDown, X } from 'lucide-react'
import type { Resource, Project } from '@/types'

interface Props {
  resources: Resource[]
  projects: Project[]
  selectedResources: number[]
  selectedProjects: number[]
  startDate: string
  endDate: string
  onResourceToggle: (id: number) => void
  onProjectToggle: (id: number) => void
  onStartChange: (d: string) => void
  onEndChange: (d: string) => void
  onNewAssignment: () => void
  onNewProject: () => void
  onScrollToday: () => void
}

/** Muestra solo el primer nombre. Si hay duplicados, agrega la inicial del apellido. */
function shortName(name: string, allNames: string[]): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  const hasDuplicate = allNames.some(
    (n) => n !== name && n.trim().split(/\s+/)[0].toLowerCase() === first.toLowerCase()
  )
  if (hasDuplicate && parts.length > 1) return `${first} ${parts[1][0].toUpperCase()}.`
  return first
}

export default function GanttControls({
  resources,
  projects,
  selectedResources,
  selectedProjects,
  startDate,
  endDate,
  onResourceToggle,
  onProjectToggle,
  onStartChange,
  onEndChange,
  onNewAssignment,
  onNewProject,
  onScrollToday,
}: Props) {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 220 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownPanelRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node
      if (
        buttonRef.current && !buttonRef.current.contains(target) &&
        dropdownPanelRef.current && !dropdownPanelRef.current.contains(target)
      ) {
        setProjectDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = () => {
    if (!projectDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: Math.max(rect.width, 240) })
    }
    setProjectDropdownOpen((o) => !o)
  }

  const clearProjects = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectedProjects.forEach((id) => onProjectToggle(id))
  }

  const buttonLabel =
    selectedProjects.length === 0
      ? 'Todos los proyectos'
      : selectedProjects.length === 1
      ? projects.find((p) => p.id === selectedProjects[0])?.name ?? '1 proyecto'
      : `${selectedProjects.length} proyectos`

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-white border-b" style={{ borderColor: '#E5E5E5' }}>
      {/* Date range */}
      <div className="flex items-center gap-2 text-sm">
        <CalendarDays size={15} className="text-gray-500" />
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs"
        />
        <span className="text-gray-400">→</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndChange(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1 text-xs"
        />
      </div>

      {/* Resource filter */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="text-gray-500 font-medium">Recursos:</span>
        {resources.map((r) => (
          <label key={r.id} className="flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={selectedResources.includes(r.id)}
              onChange={() => onResourceToggle(r.id)}
              className="w-3 h-3 accent-[#0170B9]"
            />
            <span
              className="font-medium px-1.5 py-0.5 rounded"
              style={{
                color: selectedResources.includes(r.id) ? '#fff' : r.color,
                backgroundColor: selectedResources.includes(r.id) ? r.color : 'transparent',
                border: `1px solid ${r.color}`,
                transition: 'all 0.15s',
              }}
            >
              {shortName(r.name, resources.map(x => x.name))}
            </span>
          </label>
        ))}
      </div>

      {/* Project filter — dropdown with fixed positioning to avoid z-index issues */}
      <div className="flex items-center gap-1 text-xs">
        <span className="text-gray-500 font-medium">Proyectos:</span>
        <button
          ref={buttonRef}
          onClick={handleToggle}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs bg-white hover:bg-gray-50 transition-colors min-w-[160px] justify-between"
          style={{ border: '1px solid #E5E5E5' }}
        >
          <span style={{ color: selectedProjects.length > 0 ? '#0170B9' : '#4B4F58', fontWeight: selectedProjects.length > 0 ? 600 : 400 }}>
            {buttonLabel}
          </span>
          <div className="flex items-center gap-0.5">
            {selectedProjects.length > 0 && (
              <span
                onClick={clearProjects}
                className="text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                title="Limpiar filtro"
              >
                <X size={11} />
              </span>
            )}
            <ChevronDown
              size={12}
              className="text-gray-400"
              style={{ transform: projectDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
            />
          </div>
        </button>

        {projectDropdownOpen && (
          <div
            ref={dropdownPanelRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              minWidth: dropdownPos.width,
              zIndex: 99999,
            }}
            className="bg-white border border-gray-200 rounded shadow-xl max-h-72 overflow-y-auto"
          >
            {/* Select all / Clear */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50 sticky top-0">
              <button
                onClick={() => projects.forEach((p) => { if (!selectedProjects.includes(p.id)) onProjectToggle(p.id) })}
                className="text-xs hover:underline" style={{ color: '#0170B9' }}
              >
                Seleccionar todos
              </button>
              <button
                onClick={() => selectedProjects.forEach((id) => onProjectToggle(id))}
                className="text-xs text-gray-500 hover:underline"
              >
                Limpiar
              </button>
            </div>

            {projects.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors border-b border-gray-50 hover:bg-[#F5F5F5]"
              >
                <input
                  type="checkbox"
                  checked={selectedProjects.includes(p.id)}
                  onChange={() => onProjectToggle(p.id)}
                  className="w-3.5 h-3.5 accent-blue-600 shrink-0"
                />
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-xs text-gray-800 truncate" title={p.name}>
                  {p.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={onScrollToday}
          className="text-xs px-3 py-1.5 rounded transition-colors font-medium"
          style={{ border: '1px solid #0170B9', color: '#0170B9', background: 'white' }}
          onMouseEnter={e => { (e.target as HTMLElement).style.background = '#F5F5F5' }}
          onMouseLeave={e => { (e.target as HTMLElement).style.background = 'white' }}
        >
          Hoy
        </button>
        <button
          onClick={onNewAssignment}
          className="flex items-center gap-1 text-xs px-3 py-1.5 text-white rounded transition-colors font-medium"
          style={{ backgroundColor: '#0170B9' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#005a94' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#0170B9' }}
        >
          <Plus size={13} />
          Nueva asignación
        </button>
        <button
          onClick={onNewProject}
          className="flex items-center gap-1 text-xs px-3 py-1.5 text-white rounded transition-colors font-medium"
          style={{ backgroundColor: '#3a3a3a' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#222222' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#3a3a3a' }}
        >
          <Plus size={13} />
          Nuevo proyecto
        </button>
      </div>
    </div>
  )
}
