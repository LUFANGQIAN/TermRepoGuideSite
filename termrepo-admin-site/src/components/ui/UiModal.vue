<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
  size?: 'md' | 'lg'
}
const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="props.modelValue" class="modal-mask" @click.self="close">
        <div class="modal" :class="{ 'modal--lg': props.size === 'lg' }">
          <div v-if="props.title">
            <h3 class="modal__title">{{ props.title }}</h3>
            <p v-if="props.subtitle" class="modal__sub">{{ props.subtitle }}</p>
          </div>
          <div class="modal__body">
            <slot />
          </div>
          <div class="modal__footer">
            <slot name="footer">
              <button class="button button--ghost" @click="close">关闭</button>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
