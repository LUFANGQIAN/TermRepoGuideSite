<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { adminApi, type AdminOverview } from '@/services/admin'

const overview = ref<AdminOverview | null>(null)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    overview.value = await adminApi.overview()
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageShell title="管理总览" subtitle="查看服务配置、用户规模与默认额度" />
  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>
    <section v-else-if="overview" class="card-grid card-grid--4">
      <div class="metric-card">
        <span class="metric-card__label">用户数</span>
        <span class="metric-card__value">{{ overview.users.total }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-card__label">AI 模型</span>
        <span class="metric-card__value" style="font-size: 18px">
          {{ overview.ai.provider.configured ? overview.ai.provider.model : '未配置' }}
        </span>
        <UiBadge :variant="overview.ai.provider.configured ? 'success' : 'warn'">
          {{ overview.ai.provider.configured ? '可用' : '待配置' }}
        </UiBadge>
      </div>
      <div class="metric-card">
        <span class="metric-card__label">AI 调用记录</span>
        <span class="metric-card__value">{{ overview.ai.totalCalls }}</span>
      </div>
      <div class="metric-card">
        <span class="metric-card__label">云端词条</span>
        <span class="metric-card__value">{{ overview.sync.totalTerms }}</span>
        <span class="metric-card__hint">默认上限 {{ overview.defaultQuotas.syncTermLimit }} 条/用户</span>
      </div>
    </section>
  </div>
</template>
