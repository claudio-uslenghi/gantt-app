// Minimal module-level pub-sub store for toasts — no external state library,
// same lightweight approach as the rest of components/ui/*.
export type ToastVariant = 'success' | 'error' | 'warning'

export interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

type ToastInput = Omit<ToastItem, 'id'>

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<(items: ToastItem[]) => void>()

function emit() {
  listeners.forEach((listener) => listener(items))
}

// variant has no default — every call site must consciously pick the color.
export function toast(input: ToastInput) {
  items = [...items, { ...input, id: nextId++ }]
  emit()
}

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id)
  emit()
}

export function subscribeToasts(listener: (items: ToastItem[]) => void) {
  listeners.add(listener)
  listener(items)
  return () => { listeners.delete(listener) }
}
