<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const initials = computed(() => (auth.user?.username || auth.user?.email || '?').slice(0, 1).toUpperCase())

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
        <span class="sidebar__brand-caption">管理站</span>
      </span>
    </div>

    <nav class="sidebar__group">
      <span class="sidebar__group-title">管理</span>
      <RouterLink class="sidebar__link" :to="{ name: 'admin-dashboard' }">
        <span class="sidebar__link-icon">▦</span>
        总览
      </RouterLink>
      <RouterLink class="sidebar__link" :to="{ name: 'admin-ai-provider' }">
        <span class="sidebar__link-icon">✦</span>
        AI 模型
      </RouterLink>
      <RouterLink class="sidebar__link" :to="{ name: 'admin-quotas' }">
        <span class="sidebar__link-icon">◷</span>
        默认额度
      </RouterLink>
      <RouterLink class="sidebar__link" :to="{ name: 'admin-users' }">
        <span class="sidebar__link-icon">◎</span>
        用户管理
      </RouterLink>
      <RouterLink class="sidebar__link" :to="{ name: 'admin-tickets' }">
        <span class="sidebar__link-icon">✎</span>
        工单回复
      </RouterLink>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__user">
        <span class="sidebar__avatar">{{ initials }}</span>
        <div class="sidebar__user-meta">
          <span class="sidebar__user-name">{{ auth.user?.username ?? '—' }}</span>
          <span class="sidebar__user-email">{{ auth.user?.email ?? '' }}</span>
        </div>
        <button class="sidebar__logout" type="button" title="退出登录" @click="logout">⎋</button>
      </div>
    </div>
  </aside>
</template>
