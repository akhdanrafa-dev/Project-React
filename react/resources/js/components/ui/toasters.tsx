"use client"

import { useEffect, useState } from "react"

import { registerToastListener } from "./use-toast"

type Toast = {
  title?: string
  description?: string
  duration?: number
}

export function Toaster() {
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    const unsubscribe = registerToastListener((toast) => {
      setToast(toast)
      setTimeout(
        () => setToast(null),
        toast.duration ?? 2000
      )
    })

    return unsubscribe
  }, [])

  if (!toast) return null

  return (
    <div className="fixed top-4 right-4 z-50 rounded-lg bg-black px-4 py-3 text-white shadow-lg">
      {toast.title && (
        <div className="font-semibold">{toast.title}</div>
      )}
      {toast.description && (
        <div className="text-sm opacity-90">
          {toast.description}
        </div>
      )}
    </div>
  )
}
