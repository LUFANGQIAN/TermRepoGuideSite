<script setup lang="ts">
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
</script>

<template>
  <div class="toast-stack">
    <div
      v-for="t in toast.items"
      :key="t.id"
      class="toast"
      :class="{
        'toast--success': t.variant === 'success',
        'toast--error': t.variant === 'error',
      }"
    >
      {{ t.message }}
    </div>
  </div>
</template>
