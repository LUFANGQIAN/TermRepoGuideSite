<script setup lang="ts">
interface Props {
  modelValue: boolean
  disabled?: boolean
  ariaLabel?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function onChange(e: Event) {
  const t = e.target as HTMLInputElement
  emit('update:modelValue', t.checked)
}
</script>

<template>
  <label class="switch">
    <input
      type="checkbox"
      :checked="props.modelValue"
      :disabled="props.disabled"
      :aria-label="props.ariaLabel ?? '切换开关'"
      @change="onChange"
    />
    <span class="switch__track" />
    <span class="switch__thumb" />
  </label>
</template>
