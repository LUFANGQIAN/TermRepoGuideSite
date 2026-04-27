import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ToastItem {
  id: number
  message: string
  variant: 'default' | 'success' | 'error'
}

let seq = 1

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function push(message: string, variant: ToastItem['variant'] = 'default', ttl = 3200) {
    const id = seq++
    items.value.push({ id, message, variant })
    window.setTimeout(() => {
      items.value = items.value.filter((it) => it.id !== id)
    }, ttl)
  }

  function success(message: string) {
    push(message, 'success')
  }

  function error(message: string) {
    push(message, 'error')
  }

  return { items, push, success, error }
})
