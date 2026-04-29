<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const props = defineProps<{ value: string; label?: string; mask?: boolean }>()
const toast = useToastStore()

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
    toast.success(`${props.label ?? '内容'}已复制到剪贴板`)
  } catch (_e) {
    const ta = document.createElement('textarea')
    ta.value = props.value
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
      toast.success(`${props.label ?? '内容'}已复制到剪贴板`)
    } finally {
      document.body.removeChild(ta)
    }
  }
}

function display(v: string) {
  if (!props.mask) return v
  if (v.length <= 12) return v
  return v.slice(0, 8) + '••••••••' + v.slice(-4)
}
</script>

<template>
  <div class="code-block">
    <code>{{ display(props.value) }}</code>
    <button class="button button--ghost button--small" type="button" @click="copy">
      复制
    </button>
  </div>
</template>
