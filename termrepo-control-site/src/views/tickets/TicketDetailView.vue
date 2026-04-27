<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { ticketsApi, type TicketDetail } from '@/services/tickets'
import { useToastStore } from '@/stores/toast'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{ id: string }>()
const router = useRouter()
const toast = useToastStore()

const ticket = ref<TicketDetail | null>(null)
const loading = ref(true)
const replyContent = ref('')
const replying = ref(false)
const closing = ref(false)

async function load() {
  loading.value = true
  try {
    ticket.value = await ticketsApi.detail(props.id)
  } catch (e) {
    toast.error((e as Error).message)
    router.replace({ name: 'tickets' })
  } finally {
    loading.value = false
  }
}

async function reply() {
  if (!replyContent.value.trim()) return
  replying.value = true
  try {
    const msg = await ticketsApi.reply(props.id, replyContent.value.trim())
    if (ticket.value) ticket.value.messages.push(msg)
    replyContent.value = ''
    toast.success('回复已发送')
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    replying.value = false
  }
}

async function close() {
  if (!confirm('确认关闭该工单？关闭后将无法继续回复。')) return
  closing.value = true
  try {
    await ticketsApi.close(props.id)
    toast.success('工单已关闭')
    await load()
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    closing.value = false
  }
}

const statusVariant = (s: string) =>
  s === 'open'
    ? 'warn'
    : s === 'pending'
      ? 'info'
      : s === 'resolved'
        ? 'success'
        : 'muted'

const statusLabel = (s: string) =>
  ({ open: '待处理', pending: '已回复', resolved: '已解决', closed: '已关闭' } as const)[
    s as 'open' | 'pending' | 'resolved' | 'closed'
  ]

const categoryLabel = (c: string) =>
  ({ ai: 'AI 能力', sync: '云同步', token: 'Token', account: '账户', other: '其它' })[c] ?? c

watch(() => props.id, load)
onMounted(load)
</script>

<template>
  <PageShell
    :title="ticket?.title ?? '工单详情'"
    :subtitle="ticket ? `创建于 ${formatDateTime(ticket.createdAt)}` : ''"
  >
    <template #actions>
      <RouterLink class="button button--ghost" :to="{ name: 'tickets' }">
        返回列表
      </RouterLink>
      <button
        v-if="ticket && ticket.status !== 'closed'"
        class="button button--danger"
        :disabled="closing"
        @click="close"
      >
        关闭工单
      </button>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>

    <template v-else-if="ticket">
      <section class="card" style="margin-bottom: 16px">
        <div class="row row--wrap" style="gap: 8px">
          <UiBadge :variant="statusVariant(ticket.status)">
            {{ statusLabel(ticket.status) }}
          </UiBadge>
          <UiBadge variant="muted">{{ categoryLabel(ticket.category) }}</UiBadge>
          <UiBadge variant="muted">优先级 · {{ ticket.priority }}</UiBadge>
          <span class="muted" style="margin-left: auto; font-size: 12px;">
            #{{ ticket.id }}
          </span>
        </div>
      </section>

      <section style="display: grid; gap: 12px">
        <article
          v-for="msg in ticket.messages"
          :key="msg.id"
          class="card"
          :style="{
            background: msg.from === 'staff' ? 'var(--ds-blue-soft)' : 'var(--ds-background)',
          }"
        >
          <header class="row row--between" style="margin-bottom: 8px">
            <div class="row">
              <span
                class="sidebar__avatar"
                :style="{
                  background: msg.from === 'staff' ? 'var(--ds-blue)' : 'var(--ds-text)',
                }"
              >
                {{ (msg.authorName || '?').slice(0, 1).toUpperCase() }}
              </span>
              <span style="font-weight: 600">{{ msg.authorName }}</span>
              <UiBadge :variant="msg.from === 'staff' ? 'info' : 'muted'">
                {{ msg.from === 'staff' ? '官方支持' : '用户' }}
              </UiBadge>
            </div>
            <span class="muted" style="font-size: 12px">
              {{ formatDateTime(msg.createdAt) }}
            </span>
          </header>
          <p style="white-space: pre-wrap; line-height: 1.65;">{{ msg.content }}</p>
        </article>
      </section>

      <section
        v-if="ticket.status !== 'closed'"
        class="card"
        style="margin-top: 16px"
      >
        <header class="card__head">
          <div>
            <h3 class="card__title">追加回复</h3>
            <p class="card__sub">补充复现步骤、新现象或答复官方问询</p>
          </div>
        </header>
        <textarea
          v-model="replyContent"
          class="textarea"
          rows="5"
          placeholder="补充信息..."
        />
        <div class="row" style="justify-content: flex-end; margin-top: 12px;">
          <button
            class="button button--dark"
            :disabled="replying || !replyContent.trim()"
            @click="reply"
          >
            {{ replying ? '发送中…' : '发送回复' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
