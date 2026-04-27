import { ok, fail, type MockHandler } from '..'
import { findUserBySession, getDb, nowIso, persist } from '../db'

const status: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  return ok(getDb().beta[user.id])
}

const apply: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const { reason, scope } = (req.data ?? {}) as { reason?: string; scope?: string[] }
  if (!reason) return fail(40001, '请填写申请理由')
  const db = getDb()
  const cur = db.beta[user.id]
  if (cur?.status === 'pending')
    return fail(40901, '已经提交过申请，请耐心等待', 409)
  if (cur?.status === 'approved')
    return fail(40901, '当前已通过内测，无需重复申请', 409)

  const appliedAt = nowIso()
  db.beta[user.id] = {
    status: 'pending',
    appliedAt,
    scope: scope ?? [],
    note: reason,
  }
  persist()
  return ok({ status: 'pending' as const, appliedAt })
}

export const betaHandlers = [
  { method: 'GET', pattern: /^\/beta\/status$/, handler: status },
  { method: 'POST', pattern: /^\/beta\/apply$/, handler: apply },
]
