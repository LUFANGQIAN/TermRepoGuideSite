<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { adminTicketsApi, type TicketStatus, type TicketSummary } from '@/services/tickets'
import { relativeTime } from '@/utils/format'

const status = ref<TicketStatus | ''>('')
const q = ref('')
const items = ref<TicketSummary[]>([])
const total = ref(0)
const loading = ref(true)

const statusLabel = (s: TicketStatus) => ({ open: '待处理', pending: '已回复', resolved: '已解决', closed: '已关闭' })[s]
const statusVariant = (s: TicketStatus) => s === 'open' ? 'warn' : s === 'pending' ? 'info' : s === 'resolved' ? 'success' : 'muted'
const categoryLabel = (c: string) => ({ ai: 'AI', sync: '同步', token: 'Token', account: '账户', other: '其它' })[c] ?? c
const priorityVariant = (p: string) => p === 'urgent' ? 'danger' : p === 'high' ? 'warn' : 'muted'

async function load() {
  loading.value = true
  try {
    const r = await adminTicketsApi.list({ status: status.value, q: q.value, page: 1, pageSize: 50 })
    items.value = r.items
    total.value = r.total
  } finally {
    loading.value = false
  }
}

watch(status, load)
onMounted(load)
</script>

<template>
  <PageShell title="工单回复" subtitle="查看用户工单并进行回复处理">
    <template #actions>
      <input v-model="q" class="input" placeholder="搜索标题、邮箱或昵称" style="width: 240px" @keyup.enter="load" />
      <button class="button button--ghost" @click="load">搜索</button>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <section class="card" style="padding: 14px 18px; margin-bottom: 18px">
      <div class="row row--wrap" style="gap: 6px">
        <button class="button button--ghost button--small" :class="{ 'button--dark': status === '' }" @click="status = ''">全部</button>
        <button class="button button--ghost button--small" :class="{ 'button--dark': status === 'open' }" @click="status = 'open'">待处理</button>
        <button class="button button--ghost button--small" :class="{ 'button--dark': status === 'pending' }" @click="status = 'pending'">已回复</button>
        <button class="button button--ghost button--small" :class="{ 'button--dark': status === 'resolved' }" @click="status = 'resolved'">已解决</button>
        <button class="button button--ghost button--small" :class="{ 'button--dark': status === 'closed' }" @click="status = 'closed'">已关闭</button>
      </div>
    </section>

    <section class="card">
      <div v-if="loading" class="empty">加载中…</div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>工单</th>
              <th>用户</th>
              <th>分类</th>
              <th>状态</th>
              <th>最后回复</th>
              <th style="text-align: right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ticket in items" :key="ticket.id">
              <td>
                <div style="font-weight: 500">{{ ticket.title }}</div>
                <div class="row" style="gap: 6px; margin-top: 4px">
                  <UiBadge :variant="priorityVariant(ticket.priority)">{{ ticket.priority }}</UiBadge>
                  <span class="muted">{{ ticket.messageCount }} 条消息</span>
                </div>
              </td>
              <td>
                <div>{{ ticket.user?.username ?? '—' }}</div>
                <div class="muted">{{ ticket.user?.email ?? '' }}</div>
              </td>
              <td>{{ categoryLabel(ticket.category) }}</td>
              <td><UiBadge :variant="statusVariant(ticket.status)">{{ statusLabel(ticket.status) }}</UiBadge></td>
              <td>{{ relativeTime(ticket.lastReplyAt) }}</td>
              <td style="text-align: right">
                <RouterLink class="button button--dark button--small" :to="{ name: 'admin-ticket-detail', params: { id: ticket.id } }">处理</RouterLink>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="6"><div class="empty"><span class="empty__title">暂无工单</span><span>当前筛选条件下没有工单</span></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row" style="justify-content: flex-end; margin-top: 14px"><UiBadge variant="muted">共 {{ total }} 条</UiBadge></div>
    </section>
  </div>
</template>
