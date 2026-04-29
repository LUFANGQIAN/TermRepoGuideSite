<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import ToastStack from '@/components/ui/ToastStack.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const isAuthLayout = computed(() => route.meta.layout === 'auth')

onMounted(async () => {
  if (auth.accessToken) {
    await auth.fetchMe()
  } else {
    auth.initialized = true
  }
})
</script>

<template>
  <div v-if="isAuthLayout" class="app-shell--auth">
    <RouterView />
    <ToastStack />
  </div>
  <div v-else class="app-shell">
    <AppSidebar />
    <main class="app-main">
      <RouterView />
    </main>
    <ToastStack />
  </div>
</template>
