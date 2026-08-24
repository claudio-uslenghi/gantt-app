'use client'

import { useEffect, useState } from 'react'
import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { subscribeConfirm, resolveConfirm, type ConfirmRequest } from '@/lib/confirm-dialog'

export default function ConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)

  useEffect(() => subscribeConfirm(setRequest), [])

  return (
    <AlertDialog.Root open={!!request} onOpenChange={(open) => { if (!open) resolveConfirm(false) }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/40 z-[9998]" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] w-[calc(100%-2rem)] max-w-sm bg-white rounded-lg border border-gray-200 shadow-xl p-5">
          <AlertDialog.Title className="text-base font-semibold text-[#3a3a3a]">
            {request?.title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-gray-500 mt-2">
            {request?.description}
          </AlertDialog.Description>
          <div className="flex justify-end gap-2 mt-5">
            <AlertDialog.Cancel asChild>
              <button
                onClick={() => resolveConfirm(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                {request?.cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={() => resolveConfirm(true)}
                className={`px-3 py-1.5 text-sm rounded text-white ${
                  request?.variant === 'destructive' ? 'bg-error hover:bg-red-700' : 'bg-primary hover:bg-primary-dark'
                }`}
              >
                {request?.confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
