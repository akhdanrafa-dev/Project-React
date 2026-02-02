"use client"

type ToastOptions = {
  title?: string
  description?: string
  duration?: number
  variant?: 'default' | 'destructive'
}

let listeners: ((toast: ToastOptions) => void)[] = []

export function toast(toast: ToastOptions) {
  listeners.forEach((l) => l(toast))
}

export function useToast() {
  return { toast }
}

export function registerToastListener(
  listener: (toast: ToastOptions) => void
) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}
