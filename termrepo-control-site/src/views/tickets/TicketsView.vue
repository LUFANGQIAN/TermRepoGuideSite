<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import {
  ticketsApi,
  type TicketSummary,
  type TicketStatus,
} from '@/services/tickets'
import { relativeTime } from '@/utils/format'

const status = ref<TicketStatus | ''>('')
const items = ref<TicketSummary[]>([])
const total = ref(0)
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const r = await ticketsApi.list({
      status: status.value || undefined,
      page: 1,
      pageSize: 50,
    })
    items.value = r.items
    total.value = r.total
  } finally {
    loading.value = false
  }
}

watch(status, load)

const counts = computed(() => {
  const out: Record<TicketStatus, number> = {
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
  }
  for (const it of items.value) out[it.status]++
  return out
})

const statusVariant = (s: TicketStatus) =>
  s === 'open'
    ? 'warn'
    : s === 'pending'
      ? 'info'
      : s === 'resolved'
        ? 'success'
        : 'muted'

const statusLabel = (s: TicketStatus) =>
  ({ open: '待处理', pending: '已回复', resolved: '已解决', closed: '已关闭' })[s]

const categoryLabel = (c: string) =>
  ({
    ai: 'AI 能力',
    sync: '云同步',
    token: 'Token',
    account: '账户',
    other: '其它',
  })[c] ?? c

const priorityVariant = (p: string) =>
  p === 'urgent' ? 'danger' : p === 'high' ? 'warn' : 'muted'

onMounted(load)
</script>

<template>
  <PageShell title="工单" subtitle="提交问题与建议，跟进官方处理进度">
    <template #actions>
      <RouterLink class="button button--dark" :to="{ name: 'tickets-new' }">
        + 新建工单
      </RouterLink>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <section class="card" style="padding: 14px 18px">
      <div class="row row--wrap" style="gap: 6px">
        <button
          class="button button--ghost button--small"
          :class="{ 'button--dark': status === '' }"
          @click="status = ''"
        >
          全部 <span class="muted" style="margin-left: 4px">{{ total }}</span>
        </button>
        <button
          class="button button--ghost button--small"
          :class="{ 'button--dark': status === 'open' }"
          @click="status = 'open'"
        >
          待处理
          <span class="muted" style="margin-left: 4px">{{ counts.open }}</span>
        </button>
        <button
          class="button button--ghost button--small"
          :class="{ 'button--dark': status === 'pending' }"
          @click="status = 'pending'"
        >
          已回复
          <span class="muted" style="margin-left: 4px">{{ counts.pending }}</span>
        </button>
        <button
          class="button button--ghost button--small"
          :class="{ 'button--dark': status === 'resolved' }"
          @click="status = 'resolved'"
        >
          已解决
          <span class="muted" style="margin-left: 4px">{{ counts.resolved }}</span>
        </button>
        <button
          class="button button--ghost button--small"
          :class="{ 'button--dark': status === 'closed' }"
          @click="status = 'closed'"
        >
          已关闭
          <span class="muted" style="margin-left: 4px">{{ counts.closed }}</span>
        </button>
      </div>
    </section>

    <section style="margin-top: 16px">
      <div v-if="loading" class="empty">加载中…</div>

      <div v-else-if="items.length === 0" class="card">
        <div class="empty">
          <span class="empty__title">暂无工单</span>
          <span>遇到问题或想提建议？点右上角「新建工单」</span>
        </div>
      </div>

      <ul v-else style="display: grid; gap: 12px; list-style: none">
        <li v-for="t in items" :key="t.id">
          <RouterLink
            :to="{ name: 'ticket-detail', params: { id: t.id } }"
            class="card"
            style="display: block; cursor: pointer; transition: box-shadow 200ms ease;"
          >
            <div class="row row--between" style="margin-bottom: 8px">
              <div class="row" style="flex-wrap: wrap; gap: 8px">
                <span style="font-weight: 600; font-size: 15px">{{ t.title }}</span>
                <UiBadge :variant="statusVariant(t.status)">
                  {{ statusLabel(t.status) }}
                </UiBadge>
                <UiBadge variant="muted">{{ categoryLabel(t.category) }}</UiBadge>
                <UiBadge :variant="priorityVariant(t.priority)">
                  {{ t.priority }}
                </UiBadge>
              </div>
              <span class="muted" style="font-size: 12px">
                #{{ t.id }}
              </span>
            </div>
            <div class="row row--between" style="font-size: 12.5px; color: var(--ds-gray-500)">
              <span>{{ t.messageCount }} 条消息</span>
              <span>最近回复 · {{ relativeTime(t.lastReplyAt) }}</span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </section>
  </div>
</template>
