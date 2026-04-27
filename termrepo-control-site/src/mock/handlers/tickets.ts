import { ok, fail, type MockHandler } from '..'
import { findUserBySession, getDb, newId, nowIso, persist } from '../db'
import type {
  TicketCategory,
  TicketDetail,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from '@/services/tickets'

function summarize(t: TicketDetail): TicketSummary {
  const last = t.messages[t.messages.length - 1]
  return {
    id: t.id,
    title: t.title,
    category: t.category,
    status: t.status,
    priority: t.priority,
    lastReplyAt: last?.createdAt ?? t.createdAt,
    createdAt: t.createdAt,
    messageCount: t.messages.length,
  }
}

const list: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const status = req.params?.status as TicketStatus | undefined
  const page = Number(req.params?.page ?? 1)
  const pageSize = Number(req.params?.pageSize ?? 20)
  const all = getDb().ticketsByUser[user.id] ?? []
  const filtered = status ? all.filter((t) => t.status === status) : all
  const sorted = [...filtered].sort(
    (a, b) => +new Date(b.messages.at(-1)?.createdAt ?? b.createdAt) -
      +new Date(a.messages.at(-1)?.createdAt ?? a.createdAt),
  )
  const start = (page - 1) * pageSize
  const items = sorted.slice(start, start + pageSize).map(summarize)
  return ok({ items, total: filtered.length, page, pageSize })
}

const detail: MockHandler = (req, match) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const id = match?.[1]
  const t = (getDb().ticketsByUser[user.id] ?? []).find((x) => x.id === id)
  if (!t) return fail(40400, '工单不存在', 404)
  return ok(t)
}

const create: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const {
    title,
    category,
    priority,
    content,
  } = (req.data ?? {}) as {
    title?: string
    category?: TicketCategory
    priority?: TicketPriority
    content?: string
  }
  if (!title || !content || !category || !priority)
    return fail(40001, '请填写工单标题、分类、优先级和正文')
  const id = newId('tk')
  const ticket: TicketDetail = {
    id,
    title,
    category,
    priority,
    status: 'open',
    createdAt: nowIso(),
    messages: [
      {
        id: newId('msg'),
        from: 'user',
        authorName: user.username || 'me',
        content,
        attachments: [],
        createdAt: nowIso(),
      },
    ],
  }
  const db = getDb()
  const list = db.ticketsByUser[user.id] ?? []
  list.unshift(ticket)
  db.ticketsByUser[user.id] = list
  persist()
  return ok(ticket)
}

const reply: MockHandler = (req, match) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const id = match?.[1]
  const { content } = (req.data ?? {}) as { content?: string }
  if (!content) return fail(40001, '回复内容不能为空')
  const db = getDb()
  const t = (db.ticketsByUser[user.id] ?? []).find((x) => x.id === id)
  if (!t) return fail(40400, '工单不存在', 404)
  const msg = {
    id: newId('msg'),
    from: 'user' as const,
    authorName: user.username || 'me',
    content,
    attachments: [],
    createdAt: nowIso(),
  }
  t.messages.push(msg)
  if (t.status === 'pending') t.status = 'open'
  persist()
  return ok(msg)
}

const close: MockHandler = (req, match) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const id = match?.[1]
  const db = getDb()
  const t = (db.ticketsByUser[user.id] ?? []).find((x) => x.id === id)
  if (!t) return fail(40400, '工单不存在', 404)
  t.status = 'closed'
  persist()
  return ok(null)
}

export const ticketsHandlers = [
  { method: 'GET', pattern: /^\/tickets$/, handler: list },
  { method: 'GET', pattern: /^\/tickets\/([^/]+)$/, handler: detail },
  { method: 'POST', pattern: /^\/tickets$/, handler: create },
  { method: 'POST', pattern: /^\/tickets\/([^/]+)\/reply$/, handler: reply },
  { method: 'POST', pattern: /^\/tickets\/([^/]+)\/close$/, handler: close },
]
