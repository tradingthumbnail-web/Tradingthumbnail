import { ref } from 'vue'

export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export type ToastStatus = 'info' | 'success' | 'warning' | 'error'

export interface ToastItem {
  id: number
  title?: string
  message?: string
  status: ToastStatus
  position: ToastPosition
  duration: number
  icon?: string
}

export const toasts = ref<ToastItem[]>([])

function createId() {
  return Date.now() + Math.floor(Math.random() * 1000)
}

export const useToast = () => {
  function show(payload: Partial<ToastItem> & { title?: string; message?: string }) {
    const toast: ToastItem = {
      id: createId(),
      title: payload.title ?? '',
      message: payload.message ?? '',
      status: payload.status ?? 'info',
      position: payload.position ?? 'top-right',
      duration: payload.duration ?? 4000,
      icon: payload.icon,
    }

    toasts.value.push(toast)

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => dismiss(toast.id), toast.duration)
    }

    return toast.id
  }

  function dismiss(id: number) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  function clear() {
    toasts.value.splice(0, toasts.value.length)
  }

  return { show, dismiss, clear, toasts }
}

export const showToast = (opts: Partial<ToastItem> & { title?: string; message?: string }) =>
  useToast().show(opts)

export const dismissToast = (id: number) => useToast().dismiss(id)

export default useToast