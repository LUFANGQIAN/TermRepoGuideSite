<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const initials = computed(() => {
  const name = auth.user?.username || auth.user?.email || '?'
  return name.slice(0, 1).toUpperCase()
})

async function logout() {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar__brand">
      <span class="sidebar__brand-dot" />
      <span class="sidebar__brand-meta">
        <span>TermRepo</span>
        <span class="sidebar__brand-caption">控制管理站</span>
      </span>
    </div>

    <nav class="sidebar__group">
      <span class="sidebar__group-title">总览</span>
      <RouterLink class="sidebar__link" :to="{ name: 'dashboard' }">
        <span class="sidebar__link-icon">▦</span>
        Dashboard
      </RouterLink>
    </nav>

    <nav class="sidebar__group">
      <span class="sidebar__group-title">服务</span>
      <RouterLink class="sidebar__link" :to="{ name: 'token' }">
        <span class="sidebar__link-icon">⛁</span>
        Token
      </RouterLink>
      <RouterLink class="sidebar__link" :to="{ name: 'sync' }">
        <span class="sidebar__link-icon">⇅</span>
        云同步
      </RouterLink>
      <RouterLink class="sidebar__link" :to="{ name: 'ai' }">
        <span class="sidebar__link-icon">✦</span>
        AI 能力
      </RouterLink>
    </nav>

    <nav class="sidebar__group">
      <span class="sidebar__group-title">支持</span>
      <RouterLink class="sidebar__link" :to="{ name: 'tickets' }">
        <span class="sidebar__link-icon">✎</span>
        工单
      </RouterLink>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__user">
        <span class="sidebar__avatar">{{ initials }}</span>
        <div class="sidebar__user-meta">
          <span class="sidebar__user-name">{{ auth.user?.username ?? '—' }}</span>
          <span class="sidebar__user-email">{{ auth.user?.email ?? '' }}</span>
        </div>
        <button class="sidebar__logout" type="button" title="退出登录" @click="logout">
          ⎋
        </button>
      </div>
    </div>
  </aside>
</template>
