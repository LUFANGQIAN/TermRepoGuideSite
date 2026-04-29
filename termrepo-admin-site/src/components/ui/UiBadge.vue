<script setup lang="ts">
type Variant = 'default' | 'success' | 'warn' | 'danger' | 'info' | 'muted'
const props = defineProps<{ variant?: Variant }>()
</script>

<template>
  <span
    class="badge"
    :class="{
      'badge--success': props.variant === 'success',
      'badge--warn': props.variant === 'warn',
      'badge--danger': props.variant === 'danger',
      'badge--info': props.variant === 'info',
      'badge--muted': props.variant === 'muted',
    }"
  >
    <slot />
  </span>
</template>
