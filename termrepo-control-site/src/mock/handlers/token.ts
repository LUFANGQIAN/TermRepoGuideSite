import { ok, fail, type MockHandler } from '..'
import { defaultToken, findUserBySession, getDb, nowIso, persist } from '../db'

const current: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const db = getDb()
  return ok(db.tokens[user.id])
}

const regenerate: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const db = getDb()
  const fresh = defaultToken()
  fresh.issuedAt = nowIso()
  const inThreeMonths = new Date()
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3)
  fresh.expiresAt = inThreeMonths.toISOString()
  db.tokens[user.id] = fresh
  persist()
  return ok(fresh)
}

const validate: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const { token } = (req.data ?? {}) as { token?: string }
  const cur = getDb().tokens[user.id]
  const valid = !!token && cur?.token === token && !!cur?.valid
  return ok({
    valid,
    expiresAt: valid && cur ? cur.expiresAt : null,
  })
}

export const tokenHandlers = [
  { method: 'GET', pattern: /^\/token\/current$/, handler: current },
  { method: 'POST', pattern: /^\/token\/regenerate$/, handler: regenerate },
  { method: 'POST', pattern: /^\/token\/validate$/, handler: validate },
]
