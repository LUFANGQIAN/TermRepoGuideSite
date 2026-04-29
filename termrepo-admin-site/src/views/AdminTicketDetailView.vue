<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import { adminTicketsApi, type TicketDetail, type TicketPriority, type TicketStatus } from '@/services/tickets'
import { useToastStore } from '@/stores/toast'
import { formatDateTime } from '@/utils/format'

const props = defineProps<{ id: string }>()
const router = useRouter()
const toast = useToastStore()
const ticket = ref<TicketDetail | null>(null)
const loading = ref(true)
const saving = ref(false)
const replying = ref(false)
const reply = ref('')
const nextStatus = ref<TicketStatus>('pending')

const statusLabel = (s: TicketStatus) => ({ open: '待处理', pending: '已回复', resolved: '已解决', closed: '已关闭' })[s]
const statusVariant = (s: TicketStatus) => s === 'open' ? 'warn' : s === 'pending' ? 'info' : s === 'resolved' ? 'success' : 'muted'
const categoryLabel = (c: string) => ({ ai: 'AI 能力', sync: '云同步', token: 'Token', account: '账户', other: '其它' })[c] ?? c

async function load() {
  loading.value = true
  try {
    ticket.value = await adminTicketsApi.detail(props.id)
    nextStatus.value = ticket.value.status === 'open' ? 'pending' : ticket.value.status
  } finally {
    loading.value = false
  }
}

async function saveMeta() {
  if (!ticket.value) return
  saving.value = true
  try {
    ticket.value = await adminTicketsApi.update(ticket.value.id, { status: ticket.value.status, priority: ticket.value.priority })
    toast.success('工单状态已更新')
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

async function submitReply() {
  if (!ticket.value || !reply.value.trim()) return
  replying.value = true
  try {
    await adminTicketsApi.reply(ticket.value.id, reply.value.trim(), nextStatus.value)
    reply.value = ''
    toast.success('回复已发送')
    await load()
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    replying.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageShell title="工单详情" subtitle="查看上下文并回复用户">
    <template #actions>
      <button class="button button--ghost" @click="router.back()">返回</button>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>
    <template v-else-if="ticket">
      <section class="card" style="margin-bottom: 18px">
        <div class="card__head">
          <div>
            <h3 class="card__title">{{ ticket.title }}</h3>
            <p class="card__sub">
              {{ ticket.user?.username }} · {{ ticket.user?.email }} · {{ categoryLabel(ticket.category) }} · {{ formatDateTime(ticket.createdAt) }}
            </p>
          </div>
          <UiBadge :variant="statusVariant(ticket.status)">{{ statusLabel(ticket.status) }}</UiBadge>
        </div>
        <div class="form-grid">
          <label class="field">
            <span>状态</span>
            <select v-model="ticket.status" class="select">
              <option value="open">待处理</option>
              <option value="pending">已回复</option>
              <option value="resolved">已解决</option>
              <option value="closed">已关闭</option>
            </select>
          </label>
          <label class="field">
            <span>优先级</span>
            <select v-model="ticket.priority" class="select">
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </label>
        </div>
        <div class="row" style="justify-content: flex-end; margin-top: 14px">
          <button class="button button--ghost" :disabled="saving" @click="saveMeta">{{ saving ? '保存中…' : '保存状态' }}</button>
        </div>
      </section>

      <section class="card" style="margin-bottom: 18px">
        <header class="card__head"><h3 class="card__title">消息记录</h3></header>
        <div class="timeline">
          <article v-for="message in ticket.messages" :key="message.id" class="ticket-message" :class="{ 'ticket-message--staff': message.from === 'staff' }">
            <div class="row" style="justify-content: space-between">
              <strong>{{ message.authorName }}</strong>
              <span class="muted">{{ formatDateTime(message.createdAt) }}</span>
            </div>
            <p>{{ message.content }}</p>
          </article>
        </div>
      </section>

      <section class="card">
        <header class="card__head"><h3 class="card__title">回复用户</h3></header>
        <label class="field">
          <span>回复内容</span>
          <textarea v-model="reply" class="textarea" rows="7" placeholder="输入回复内容、排查建议或处理结果" />
        </label>
        <label class="field" style="margin-top: 12px">
          <span>回复后状态</span>
          <select v-model="nextStatus" class="select" style="max-width: 220px">
            <option value="pending">已回复</option>
            <option value="resolved">已解决</option>
            <option value="open">待处理</option>
            <option value="closed">已关闭</option>
          </select>
        </label>
        <div class="row" style="justify-content: flex-end; margin-top: 14px">
          <button class="button button--dark" :disabled="replying || !reply.trim()" @click="submitReply">{{ replying ? '发送中…' : '发送回复' }}</button>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.ticket-message {
  padding: 14px;
  border-radius: 10px;
  box-shadow: var(--ds-shadow-border);
  margin-bottom: 10px;
}

.ticket-message--staff {
  background: #fafafa;
}

.ticket-message p {
  margin: 10px 0 0;
  color: var(--ds-gray-900);
  line-height: 1.65;
  white-space: pre-wrap;
}
</style>
