import { ok, fail, type MockHandler } from '..'
import {
  ensureUserDefaults,
  findUserBySession,
  getDb,
  issueToken,
  newId,
  nowIso,
  persist,
  type UserRow,
} from '../db'

const register: MockHandler = (req) => {
  const { email, password, username } = (req.data ?? {}) as Record<string, string>
  if (!email || !password) return fail(40001, '邮箱与密码不能为空')
  const db = getDb()
  if (db.users.find((u) => u.email === email))
    return fail(40901, '该邮箱已被注册', 409)

  const id = newId('u')
  const user: UserRow = {
    id,
    email,
    username: username || email.split('@')[0] || email,
    password,
    betaStatus: 'none',
    aiEnabled: false,
    syncEnabled: false,
    tokenValid: true,
    createdAt: nowIso(),
  }
  db.users.push(user)
  ensureUserDefaults(id)

  const accessToken = issueToken()
  const refreshToken = issueToken()
  db.sessions[accessToken] = id
  persist()

  return ok({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  })
}

const login: MockHandler = (req) => {
  const { email, password } = (req.data ?? {}) as Record<string, string>
  if (!email || !password) return fail(40001, '邮箱与密码不能为空')
  const db = getDb()
  const user = db.users.find((u) => u.email === email && u.password === password)
  if (!user) return fail(40103, '邮箱或密码不正确')

  const accessToken = issueToken()
  const refreshToken = issueToken()
  db.sessions[accessToken] = user.id
  persist()

  return ok({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      createdAt: user.createdAt,
    },
  })
}

const me: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  ensureUserDefaults(user.id)
  const db = getDb()
  const beta = db.beta[user.id]
  user.betaStatus = beta?.status ?? 'none'
  user.aiEnabled = db.ai[user.id]?.enabled ?? false
  user.syncEnabled = db.sync[user.id]?.enabled ?? false
  user.tokenValid = db.tokens[user.id]?.valid ?? true
  return ok({
    id: user.id,
    email: user.email,
    username: user.username,
    betaStatus: user.betaStatus,
    aiEnabled: user.aiEnabled,
    syncEnabled: user.syncEnabled,
    tokenValid: user.tokenValid,
    createdAt: user.createdAt,
  })
}

const logout: MockHandler = (req) => {
  const auth = (req.headers['Authorization'] || req.headers['authorization']) as
    | string
    | undefined
  if (!auth) return fail(40101, '未登录', 401)
  const token = auth.replace(/^Bearer\s+/i, '')
  const db = getDb()
  delete db.sessions[token]
  persist()
  return ok(null)
}

export const authHandlers = [
  { method: 'POST', pattern: /^\/auth\/register$/, handler: register },
  { method: 'POST', pattern: /^\/auth\/login$/, handler: login },
  { method: 'GET', pattern: /^\/auth\/me$/, handler: me },
  { method: 'POST', pattern: /^\/auth\/logout$/, handler: logout },
]
