// Promise-based confirm() replacement — same store pattern as lib/toast.ts.
// Mirrors the ergonomics of native confirm() at call sites: a single
// awaited call that resolves true/false.
export type ConfirmVariant = 'destructive' | 'default'

export interface ConfirmOptions {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmVariant
}

export interface ConfirmRequest {
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  variant: ConfirmVariant
  resolve: (value: boolean) => void
}

let current: ConfirmRequest | null = null
const listeners = new Set<(request: ConfirmRequest | null) => void>()

function emit() {
  listeners.forEach((listener) => listener(current))
}

// Only one confirm can be open at a time — it's a blocking modal, so that
// matches how it's actually used (never two decisions pending at once).
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    current = {
      title: options.title,
      description: options.description,
      confirmLabel: options.confirmLabel ?? 'Confirmar',
      cancelLabel: options.cancelLabel ?? 'Cancelar',
      variant: options.variant ?? 'destructive',
      resolve,
    }
    emit()
  })
}

export function subscribeConfirm(listener: (request: ConfirmRequest | null) => void) {
  listeners.add(listener)
  listener(current)
  return () => { listeners.delete(listener) }
}

export function resolveConfirm(value: boolean) {
  current?.resolve(value)
  current = null
  emit()
}
