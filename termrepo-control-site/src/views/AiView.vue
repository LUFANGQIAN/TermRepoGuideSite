<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import { aiApi, type AiStatus, type AiUsage } from '@/services/ai'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime } from '@/utils/format'

const toast = useToastStore()
const auth = useAuthStore()

const status = ref<AiStatus | null>(null)
const usage = ref<AiUsage | null>(null)
const range = ref<'24h' | '7d' | '30d'>('7d')
const loading = ref(true)

async function loadStatus() {
  status.value = await aiApi.status()
}
async function loadUsage() {
  usage.value = await aiApi.usage(range.value)
}

async function loadAll() {
  loading.value = true
  try {
    await Promise.all([loadStatus(), loadUsage()])
  } finally {
    loading.value = false
  }
}

async function onToggle(v: boolean) {
  try {
    status.value = await aiApi.toggle(v)
    auth.patchUser({ aiEnabled: v })
    toast.success(v ? 'AI 能力已开启' : 'AI 能力已关闭')
  } catch (e) {
    toast.error((e as Error).message)
  }
}

const weeklyPct = computed(() => percent(status.value?.quota.weekly))
const monthlyPct = computed(() => percent(status.value?.quota.monthly))

function percent(q?: { limit: number; used: number }) {
  if (!q || q.limit === 0) return 0
  return Math.min(100, Math.round((q.used / q.limit) * 100))
}

function quotaVariant(p: number) {
  if (p >= 90) return 'progress__bar--danger'
  if (p >= 70) return 'progress__bar--warn'
  return ''
}

const kindLabel = (k: string) =>
  ({ annotate: '生成备注', 'split-suggest': '拆词建议', rename: '命名建议' })[k] ?? k

watch(range, () => loadUsage())

onMounted(loadAll)
</script>

<template>
  <PageShell title="AI 能力" subtitle="管理 AI 备注建议、剩余额度与调用历史">
    <template #actions>
      <UiBadge :variant="status?.enabled ? 'success' : 'muted'">
        {{ status?.enabled ? '已开启' : '已关闭' }}
      </UiBadge>
      <UiSwitch
        v-if="status"
        :model-value="status.enabled"
        @update:model-value="onToggle"
      />
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>

    <template v-else-if="status">
      <section class="card-grid card-grid--3">
        <div class="metric-card">
          <span class="metric-card__label">使用模型</span>
          <span class="metric-card__value" style="font-size: 18px">
            {{ status.provider.configured ? status.provider.model : '未检测到模型' }}
          </span>
          <span class="metric-card__hint">
            {{ status.provider.configured ? '由服务管理员在管理站配置' : '请联系服务管理员完成 AI 模型配置' }}
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-card__label">本周剩余</span>
          <span class="metric-card__value">
            {{ status.quota.weekly.limit - status.quota.weekly.used }}
            <span class="muted" style="font-size: 14px; font-weight: 500;">
              / {{ status.quota.weekly.limit }}
            </span>
          </span>
          <div class="progress" style="margin-top: 6px;">
            <div
              class="progress__bar"
              :class="quotaVariant(weeklyPct)"
              :style="{ '--p': weeklyPct + '%' } as Record<string, string>"
            />
          </div>
          <span class="metric-card__hint">
            重置于 {{ formatDateTime(status.resetAt.weekly) }}
          </span>
        </div>

        <div class="metric-card">
          <span class="metric-card__label">本月剩余</span>
          <span class="metric-card__value">
            {{ status.quota.monthly.limit - status.quota.monthly.used }}
            <span class="muted" style="font-size: 14px; font-weight: 500;">
              / {{ status.quota.monthly.limit }}
            </span>
          </span>
          <div class="progress" style="margin-top: 6px;">
            <div
              class="progress__bar"
              :class="quotaVariant(monthlyPct)"
              :style="{ '--p': monthlyPct + '%' } as Record<string, string>"
            />
          </div>
          <span class="metric-card__hint">
            重置于 {{ formatDateTime(status.resetAt.monthly) }}
          </span>
        </div>
      </section>

      <section v-if="!status.provider.configured" class="card" style="margin-top: 24px">
        <div class="empty">
          <span class="empty__title">未检测到 AI 模型</span>
          <span>当前服务还没有在管理站配置模型端点与 API Key。配置完成后，插件收藏术语时即可使用 AI 辅助翻译。</span>
        </div>
      </section>

      <section class="card" style="margin-top: 24px">
        <header class="card__head">
          <div>
            <h3 class="card__title">调用历史摘要</h3>
            <p class="card__sub">
              用于排查异常请求与额度消耗，仅展示最近 50 条
            </p>
          </div>
          <select v-model="range" class="select" style="max-width: 140px;">
            <option value="24h">近 24 小时</option>
            <option value="7d">近 7 天</option>
            <option value="30d">近 30 天</option>
          </select>
        </header>

        <div v-if="usage" class="card-grid card-grid--3" style="margin-bottom: 18px;">
          <div class="metric-card">
            <span class="metric-card__label">总调用</span>
            <span class="metric-card__value">{{ usage.summary.totalCalls }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">成功率</span>
            <span class="metric-card__value">
              {{ Math.round(usage.summary.successRate * 100) }}%
            </span>
          </div>
          <div class="metric-card">
            <span class="metric-card__label">平均延迟</span>
            <span class="metric-card__value">
              {{ usage.summary.avgLatencyMs }} <span class="muted" style="font-size: 14px; font-weight: 500;">ms</span>
            </span>
          </div>
        </div>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>时间</th>
                <th>类型</th>
                <th>输入</th>
                <th>输出预览</th>
                <th style="text-align: right">延迟</th>
                <th style="text-align: right">状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="it in usage?.items" :key="it.id">
                <td>{{ formatDateTime(it.calledAt) }}</td>
                <td><UiBadge variant="muted">{{ kindLabel(it.kind) }}</UiBadge></td>
                <td><code>{{ it.input }}</code></td>
                <td>
                  <span class="muted">{{ it.outputPreview }}</span>
                </td>
                <td style="text-align: right"><code>{{ it.latencyMs }} ms</code></td>
                <td style="text-align: right">
                  <UiBadge :variant="it.success ? 'success' : 'danger'">
                    {{ it.success ? '成功' : '失败' }}
                  </UiBadge>
                </td>
              </tr>
              <tr v-if="usage?.items?.length === 0">
                <td colspan="6">
                  <div class="empty">
                    <span class="empty__title">无调用记录</span>
                    <span>该区间内插件未调用 AI 接口</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>
