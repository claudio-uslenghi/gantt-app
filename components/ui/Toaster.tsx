'use client'

import { useEffect, useState } from 'react'
import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react'
import { dismissToast, subscribeToasts, type ToastItem, type ToastVariant } from '@/lib/toast'

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle2; iconClass: string; barClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-success', barClass: 'bg-success' },
  error: { icon: XCircle, iconClass: 'text-error', barClass: 'bg-error' },
  warning: { icon: AlertTriangle, iconClass: 'text-warning', barClass: 'bg-warning' },
}

// Success/warning read fast — 5s auto-dismiss. Errors need more time to
// read, 7s. Both dismissible early via the close button; Radix pauses the
// timer on hover automatically.
const DURATIONS: Record<ToastVariant, number> = { success: 5000, error: 7000, warning: 5000 }

export default function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribeToasts(setItems), [])

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {items.map((item) => {
        const { icon: Icon, iconClass, barClass } = VARIANT_STYLES[item.variant]
        return (
          <ToastPrimitive.Root
            key={item.id}
            duration={DURATIONS[item.variant]}
            onOpenChange={(open) => { if (!open) dismissToast(item.id) }}
            className="toast-root relative flex items-start gap-3 bg-white rounded-lg border border-gray-200 shadow-lg p-4 pr-8 overflow-hidden"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${barClass}`} />
            <Icon size={18} className={`shrink-0 mt-0.5 ${iconClass}`} />
            <div className="min-w-0">
              <ToastPrimitive.Title className="text-sm font-semibold text-[#3a3a3a]">
                {item.title}
              </ToastPrimitive.Title>
              {item.description && (
                <ToastPrimitive.Description className="text-sm text-gray-500 mt-0.5">
                  {item.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              aria-label="Cerrar"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm outline-none" />
    </ToastPrimitive.Provider>
  )
}
