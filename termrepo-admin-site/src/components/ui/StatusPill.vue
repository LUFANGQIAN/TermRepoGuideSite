<script setup lang="ts">
import UiBadge from './UiBadge.vue'

const props = defineProps<{ enabled?: boolean | null; trueLabel?: string; falseLabel?: string }>()
</script>

<template>
  <UiBadge :variant="props.enabled ? 'success' : 'muted'">
    {{ props.enabled ? (props.trueLabel ?? '已开通') : (props.falseLabel ?? '未开通') }}
  </UiBadge>
</template>
