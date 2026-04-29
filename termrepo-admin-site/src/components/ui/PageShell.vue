<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="page-shell">
    <header class="page-shell__head">
      <div>
        <h1 class="page-shell__title">{{ title }}</h1>
        <p v-if="subtitle" class="page-shell__sub">{{ subtitle }}</p>
      </div>
      <div class="page-shell__actions">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </div>
</template>
