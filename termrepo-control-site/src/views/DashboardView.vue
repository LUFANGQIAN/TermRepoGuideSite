<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import { betaApi, type BetaInfo } from '@/services/beta'
import { tokenApi, type TokenInfo } from '@/services/token'
import { syncApi, type SyncStatus } from '@/services/sync'
import { aiApi, type AiStatus } from '@/services/ai'
import { formatDateTime, daysUntil } from '@/utils/format'

const auth = useAuthStore()
const toast = useToastStore()

const beta = ref<BetaInfo | null>(null)
const token = ref<TokenInfo | null>(null)
const sync = ref<SyncStatus | null>(null)
const ai = ref<AiStatus | null>(null)
const loading = ref(true)

const showApply = ref(false)
const applyReason = ref('希望体验 AI 自动备注 + 云同步')

async function load() {
  loading.value = true
  try {
    const [b, t, s, a] = await Promise.all([
      betaApi.status(),
      tokenApi.current(),
      syncApi.status(),
      aiApi.status(),
    ])
    beta.value = b
    token.value = t
    sync.value = s
    ai.value = a
  } finally {
    loading.value = false
  }
}

async function applyBeta() {
  try {
    await betaApi.apply(applyReason.value, ['ai', 'sync'])
    toast.success('内测申请已提交')
    showApply.value = false
    await load()
    await auth.fetchMe()
  } catch (e) {
    toast.error((e as Error).message)
  }
}

const betaVariant = computed(() => {
  switch (beta.value?.status) {
    case 'approved':
      return 'success' as const
    case 'pending':
      return 'warn' as const
    case 'rejected':
      return 'danger' as const
    default:
      return 'muted' as const
  }
})

const betaLabel = computed(() => {
  switch (beta.value?.status) {
    case 'approved':
      return '已通过'
    case 'pending':
      return '审核中'
    case 'rejected':
      return '未通过'
    default:
      return '未申请'
  }
})

const tokenDays = computed(() =>
  token.value ? daysUntil(token.value.expiresAt) : 0,
)

onMounted(load)
</script>

<template>
  <PageShell title="Dashboard" subtitle="TermRepo 增强能力一览" />

  <div class="page-shell" style="padding-top: 0">
    <section class="card-grid card-grid--4" v-if="!loading">
      <div class="metric-card">
        <span class="metric-card__label">
          内测资格
          <UiBadge :variant="betaVariant">{{ betaLabel }}</UiBadge>
        </span>
        <span class="metric-card__value">{{ beta?.scope.length ?? 0 }} 项</span>
        <span class="metric-card__hint">
          {{ beta?.scope?.length ? beta.scope.join(' · ') : '当前没有开通的能力' }}
        </span>
      </div>

      <div class="metric-card">
        <span class="metric-card__label">
          AI 建议
          <UiBadge :variant="ai?.enabled ? 'success' : 'muted'">
            {{ ai?.enabled ? '已开通' : '未开通' }}
          </UiBadge>
        </span>
        <span class="metric-card__value">
          {{ ai?.quota.monthly.used ?? 0 }} / {{ ai?.quota.monthly.limit ?? 0 }}
        </span>
        <span class="metric-card__hint">本月调用 / 月度额度</span>
      </div>

      <div class="metric-card">
        <span class="metric-card__label">
          云同步
          <UiBadge :variant="sync?.enabled ? 'success' : 'muted'">
            {{ sync?.enabled ? '已启用' : '未启用' }}
          </UiBadge>
        </span>
        <span class="metric-card__value">{{ sync?.termCount ?? 0 }} 条</span>
        <span class="metric-card__hint">
          上次同步 · {{ formatDateTime(sync?.lastSyncAt) }}
        </span>
      </div>

      <div class="metric-card">
        <span class="metric-card__label">
          Token 状态
          <UiBadge :variant="token?.valid ? 'success' : 'danger'">
            {{ token?.valid ? '有效' : '失效' }}
          </UiBadge>
        </span>
        <span class="metric-card__value">{{ tokenDays }} 天</span>
        <span class="metric-card__hint">
          到期时间 · {{ formatDateTime(token?.expiresAt) }}
        </span>
      </div>
    </section>

    <div v-else class="empty">数据加载中…</div>

    <div class="card-grid card-grid--2" style="margin-top: 24px">
      <section class="card" v-if="beta">
        <header class="card__head">
          <div>
            <h3 class="card__title">内测资格</h3>
            <p class="card__sub">
              赞助制内测目前覆盖 AI 备注与云同步两项能力。功能与配额仍可能调整。
            </p>
          </div>
          <UiBadge :variant="betaVariant">{{ betaLabel }}</UiBadge>
        </header>

        <div class="meta-list">
          <div class="meta-list__row">
            <span class="meta-list__label">权限范围</span>
            <span>
              <span v-if="beta.scope.length === 0" class="muted">—</span>
              <span v-else class="tag-row">
                <span v-for="s in beta.scope" :key="s" class="scope-pill">{{ s }}</span>
              </span>
            </span>
          </div>
          <div class="meta-list__row">
            <span class="meta-list__label">提交时间</span>
            <span>{{ formatDateTime(beta.appliedAt) }}</span>
          </div>
          <div class="meta-list__row">
            <span class="meta-list__label">通过时间</span>
            <span>{{ formatDateTime(beta.approvedAt) }}</span>
          </div>
          <div class="meta-list__row">
            <span class="meta-list__label">备注</span>
            <span>{{ beta.note ?? '—' }}</span>
          </div>
        </div>

        <div class="row" style="margin-top: 16px; justify-content: flex-end;">
          <button
            v-if="beta.status === 'none' || beta.status === 'rejected'"
            class="button button--dark"
            @click="showApply = true"
          >
            申请内测
          </button>
          <button v-else class="button button--ghost" disabled>
            {{ beta.status === 'pending' ? '审核中' : '已通过' }}
          </button>
        </div>
      </section>

      <section class="card">
        <header class="card__head">
          <div>
            <h3 class="card__title">快速操作</h3>
            <p class="card__sub">
              按需开关增强能力；本地词库无论开关状态都可继续使用。
            </p>
          </div>
        </header>

        <ul style="display: grid; gap: 14px; list-style: none;">
          <li class="row row--between">
            <div>
              <div style="font-weight: 500">查看 / 复制 token</div>
              <div class="muted" style="font-size: 12.5px">
                插件粘贴 token 即可接入云能力
              </div>
            </div>
            <RouterLink class="button button--ghost button--small" :to="{ name: 'token' }">
              前往 Token
            </RouterLink>
          </li>
          <li class="row row--between">
            <div>
              <div style="font-weight: 500">手动触发同步 / 查看冲突</div>
              <div class="muted" style="font-size: 12.5px">
                设备列表与冲突解决都在云同步页
              </div>
            </div>
            <RouterLink class="button button--ghost button--small" :to="{ name: 'sync' }">
              前往云同步
            </RouterLink>
          </li>
          <li class="row row--between">
            <div>
              <div style="font-weight: 500">查看 AI 用量 / 开关</div>
              <div class="muted" style="font-size: 12.5px">
                可一键关闭，避免误触发额度
              </div>
            </div>
            <RouterLink class="button button--ghost button--small" :to="{ name: 'ai' }">
              前往 AI
            </RouterLink>
          </li>
          <li class="row row--between">
            <div>
              <div style="font-weight: 500">提交工单</div>
              <div class="muted" style="font-size: 12.5px">
                AI 异常 / 同步异常 / 反馈建议
              </div>
            </div>
            <RouterLink class="button button--ghost button--small" :to="{ name: 'tickets' }">
              前往工单
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showApply" class="modal-mask" @click.self="showApply = false">
        <div class="modal">
          <h3 class="modal__title">申请内测资格</h3>
          <p class="modal__sub">
            请简单说明使用场景，我们会在 1–2 个工作日内审核反馈。
          </p>
          <div class="modal__body">
            <textarea
              v-model="applyReason"
              class="textarea"
              rows="4"
              placeholder="请简述希望体验的能力与使用场景"
            />
          </div>
          <div class="modal__footer">
            <button class="button button--ghost" @click="showApply = false">取消</button>
            <button class="button button--dark" @click="applyBeta">提交申请</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
