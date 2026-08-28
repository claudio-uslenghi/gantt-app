'use client'

import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Copy, ChevronDown } from 'lucide-react'

interface Props {
  disabled?: boolean
  loading?: boolean
  /** Shorter label for narrow screens — full text on desktop. */
  compact?: boolean
  onCopyActivitiesOnly: () => void
  onCopyActivitiesAndTime: () => void
}

// Clockify-style split button: "Copiar la semana pasada" ▾ with 2 options.
// Built on @radix-ui/react-dropdown-menu (already a dependency, unused
// elsewhere) — Portal + Popper give us collision-aware positioning for
// free, so this can't get clipped by an ancestor's overflow like the old
// SearchableSelect dropdown used to.
export default function CopyLastWeekMenu({
  disabled,
  loading,
  compact,
  onCopyActivitiesOnly,
  onCopyActivitiesAndTime,
}: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          disabled={disabled || loading}
          className="inline-flex items-center gap-1.5 border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        >
          <Copy size={14} className="shrink-0" />
          <span>{loading ? 'Copiando...' : compact ? 'Copiar semana' : 'Copiar la semana pasada'}</span>
          <ChevronDown size={14} className="text-gray-400 shrink-0" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="min-w-[220px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
        >
          <DropdownMenu.Item
            onSelect={onCopyActivitiesOnly}
            className="px-3 py-2 text-sm text-gray-700 cursor-pointer outline-none hover:bg-gray-50 data-[highlighted]:bg-gray-50"
          >
            Copiar solo actividades
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onCopyActivitiesAndTime}
            className="px-3 py-2 text-sm text-gray-700 cursor-pointer outline-none hover:bg-gray-50 data-[highlighted]:bg-gray-50"
          >
            Copiar actividades y tiempo
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
