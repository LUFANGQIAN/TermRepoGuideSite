import { ok, fail, type MockHandler } from '..'
import { findUserBySession, getDb, persist } from '../db'
import type { AiStatus } from '@/services/ai'

function aiOf(userId: string): AiStatus {
  const cur = getDb().ai[userId]
  if (!cur) throw new Error('ai state not initialized')
  return cur
}

const status: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  return ok(aiOf(user.id))
}

const toggle: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const { enabled } = (req.data ?? {}) as { enabled?: boolean }
  const next: AiStatus = { ...aiOf(user.id), enabled: !!enabled }
  getDb().ai[user.id] = next
  persist()
  return ok(next)
}

const usage: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const range = (req.params?.range as string) ?? '7d'
  const db = getDb()
  const all = db.aiUsage[user.id] ?? []
  const horizon =
    range === '24h' ? 24 * 3600_000 : range === '30d' ? 30 * 86_400_000 : 7 * 86_400_000
  const cutoff = Date.now() - horizon
  const items = all.filter((it) => +new Date(it.calledAt) >= cutoff)
  const total = items.length
  const successCount = items.filter((it) => it.success).length
  const successRate = total === 0 ? 0 : successCount / total
  const avg =
    total === 0 ? 0 : Math.round(items.reduce((s, it) => s + it.latencyMs, 0) / total)
  return ok({
    summary: { totalCalls: total, successRate, avgLatencyMs: avg },
    items: items.slice(0, 50),
  })
}

export const aiHandlers = [
  { method: 'GET', pattern: /^\/ai\/status$/, handler: status },
  { method: 'POST', pattern: /^\/ai\/toggle$/, handler: toggle },
  { method: 'GET', pattern: /^\/ai\/usage$/, handler: usage },
]
