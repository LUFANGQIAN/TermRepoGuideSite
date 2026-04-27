// Persistent in-memory mock store.
// Survives navigation; persists to localStorage for refresh.

import type { User } from '@/services/auth'
import type { BetaInfo } from '@/services/beta'
import type { TokenInfo } from '@/services/token'
import type { SyncStatus, Device, Conflict } from '@/services/sync'
import type { AiStatus, AiUsageItem } from '@/services/ai'
import type {
  TicketDetail,
  TicketSummary,
  TicketMessage,
} from '@/services/tickets'

const LS_KEY = 'trp.mock.db.v1'

interface UserRow extends User {
  password: string
}

export interface MockDb {
  users: UserRow[]
  sessions: Record<string, string> // accessToken -> userId
  beta: Record<string, BetaInfo>
  tokens: Record<string, TokenInfo>
  sync: Record<string, SyncStatus>
  devices: Record<string, Device[]>
  conflicts: Record<string, Conflict[]>
  ai: Record<string, AiStatus>
  aiUsage: Record<string, AiUsageItem[]>
  ticketsByUser: Record<string, TicketDetail[]>
}

function nowIso(): string {
  return new Date().toISOString()
}

function defaultBeta(): BetaInfo {
  return {
    status: 'approved',
    appliedAt: '2026-04-12T10:00:00.000Z',
    approvedAt: '2026-04-15T10:00:00.000Z',
    scope: ['ai', 'sync'],
    note: '感谢赞助支持，已开通 AI + 云同步内测资格',
  }
}

function defaultToken(): TokenInfo {
  return {
    token: 'trp_live_' + randomString(28),
    endpoint: 'https://api.termrepo.dev/v1',
    version: 'v1',
    valid: true,
    issuedAt: '2026-04-15T10:00:00.000Z',
    expiresAt: '2026-07-15T10:00:00.000Z',
    scopes: ['ai.suggest', 'sync.read', 'sync.write'],
    scopeDescriptions: {
      'ai.suggest': '调用 AI 备注建议',
      'sync.read': '读取云端词库快照',
      'sync.write': '上传 / 合并云端词库',
    },
  }
}

function defaultSync(): SyncStatus {
  return {
    enabled: true,
    termCount: 482,
    lastSyncAt: '2026-04-25T09:42:13.000Z',
    lastSyncStatus: 'conflict',
    pendingConflicts: 2,
    snapshotVersion: 17,
  }
}

function defaultDevices(): Device[] {
  return [
    {
      id: 'dev_001',
      name: 'MacBook Pro 16',
      platform: 'vscode-darwin',
      current: true,
      lastActiveAt: '2026-04-25T09:42:13.000Z',
      registeredAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 'dev_002',
      name: 'ThinkPad T14',
      platform: 'vscode-linux',
      current: false,
      lastActiveAt: '2026-04-22T20:11:00.000Z',
      registeredAt: '2026-03-15T10:00:00.000Z',
    },
    {
      id: 'dev_003',
      name: 'Office Desktop',
      platform: 'vscode-win32',
      current: false,
      lastActiveAt: '2026-04-19T13:02:00.000Z',
      registeredAt: '2026-04-01T10:00:00.000Z',
    },
  ]
}

function defaultConflicts(): Conflict[] {
  return [
    {
      id: 'cf_001',
      term: 'userIdToken',
      localUpdatedAt: '2026-04-25T08:00:00.000Z',
      remoteUpdatedAt: '2026-04-25T08:30:00.000Z',
      localValue: { note: '用户主 ID' },
      remoteValue: { note: '用户主 ID Token，常用于鉴权' },
    },
    {
      id: 'cf_002',
      term: 'snake_case_handler',
      localUpdatedAt: '2026-04-24T22:10:00.000Z',
      remoteUpdatedAt: '2026-04-25T07:30:00.000Z',
      localValue: { note: '蛇形命名处理器' },
      remoteValue: { note: '蛇形命名（snake_case）处理器，处理函数命名转换' },
    },
  ]
}

function defaultAi(): AiStatus {
  return {
    enabled: true,
    model: 'claude-haiku-4-5',
    quota: {
      weekly: { limit: 200, used: 36 },
      monthly: { limit: 1000, used: 148 },
    },
    resetAt: {
      weekly: '2026-05-04T00:00:00.000Z',
      monthly: '2026-05-01T00:00:00.000Z',
    },
  }
}

function defaultAiUsage(): AiUsageItem[] {
  const samples: Array<Pick<AiUsageItem, 'kind' | 'input' | 'outputPreview'>> = [
    {
      kind: 'annotate',
      input: 'userIdToken',
      outputPreview: '用户主 ID Token，常用于鉴权…',
    },
    {
      kind: 'split-suggest',
      input: 'fetchUserAvatarUrl',
      outputPreview: '建议拆分：fetch / User / Avatar / Url',
    },
    {
      kind: 'annotate',
      input: 'isFeatureEnabled',
      outputPreview: '判断指定功能是否启用…',
    },
    {
      kind: 'rename',
      input: 'tmp1',
      outputPreview: '建议命名：pendingTermBuffer',
    },
    {
      kind: 'annotate',
      input: 'snake_case_handler',
      outputPreview: '蛇形命名（snake_case）处理器…',
    },
    {
      kind: 'split-suggest',
      input: 'rgbToHexString',
      outputPreview: '建议拆分：rgb / To / Hex / String',
    },
  ]
  const out: AiUsageItem[] = []
  for (let i = 0; i < 24; i++) {
    const s = samples[i % samples.length]!
    out.push({
      id: `log_${String(1000 + i)}`,
      calledAt: new Date(Date.now() - i * 3600 * 1000 * 5).toISOString(),
      kind: s.kind,
      input: s.input,
      outputPreview: s.outputPreview,
      latencyMs: 540 + ((i * 73) % 600),
      success: i % 11 !== 5,
    })
  }
  return out
}

function defaultTickets(): TicketDetail[] {
  return [
    {
      id: 'tk_001',
      title: 'AI 备注偶发超时',
      category: 'ai',
      status: 'pending',
      priority: 'normal',
      createdAt: '2026-04-23T10:00:00.000Z',
      messages: [
        {
          id: 'msg_001',
          from: 'user',
          authorName: 'me',
          content:
            '今天上午调用 AI 备注建议时，约有 1/3 的请求会出现 timeout，重试后才能成功。现象集中在上午 10:00 - 11:00。',
          attachments: [],
          createdAt: '2026-04-23T10:00:00.000Z',
        },
        {
          id: 'msg_002',
          from: 'staff',
          authorName: 'TermRepo 支持',
          content:
            '已收到反馈，初步定位是上游限流，将在 24h 内修复。修复后会在此回复。',
          attachments: [],
          createdAt: '2026-04-23T18:00:00.000Z',
        },
      ],
    },
    {
      id: 'tk_002',
      title: '希望增加导入 Anki 卡片格式',
      category: 'other',
      status: 'open',
      priority: 'low',
      createdAt: '2026-04-20T15:00:00.000Z',
      messages: [
        {
          id: 'msg_003',
          from: 'user',
          authorName: 'me',
          content:
            '是否考虑支持把云端词库导出为 Anki 可导入的 .apkg 格式，方便复习？',
          attachments: [],
          createdAt: '2026-04-20T15:00:00.000Z',
        },
      ],
    },
    {
      id: 'tk_003',
      title: 'Token 复制按钮在 Safari 不生效',
      category: 'token',
      status: 'resolved',
      priority: 'low',
      createdAt: '2026-04-15T20:00:00.000Z',
      messages: [
        {
          id: 'msg_004',
          from: 'user',
          authorName: 'me',
          content: 'Safari 17 上点击「复制 token」按钮没有反应。',
          attachments: [],
          createdAt: '2026-04-15T20:00:00.000Z',
        },
        {
          id: 'msg_005',
          from: 'staff',
          authorName: 'TermRepo 支持',
          content:
            '已修复，原因是 clipboard API 在 http 域名下被禁用，控制站现已强制 https。',
          attachments: [],
          createdAt: '2026-04-16T11:30:00.000Z',
        },
      ],
    },
    {
      id: 'tk_004',
      title: '云同步合并冲突时希望支持手动编辑',
      category: 'sync',
      status: 'open',
      priority: 'high',
      createdAt: '2026-04-12T09:30:00.000Z',
      messages: [
        {
          id: 'msg_006',
          from: 'user',
          authorName: 'me',
          content:
            '现在冲突解决只能选择「保留本地 / 保留云端」，希望能直接编辑合并后的备注。',
          attachments: [],
          createdAt: '2026-04-12T09:30:00.000Z',
        },
      ],
    },
  ]
}

function randomString(n: number) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = ''
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

function emptyDb(): MockDb {
  return {
    users: [],
    sessions: {},
    beta: {},
    tokens: {},
    sync: {},
    devices: {},
    conflicts: {},
    ai: {},
    aiUsage: {},
    ticketsByUser: {},
  }
}

let dbCache: MockDb | null = null

function load(): MockDb {
  if (dbCache) return dbCache
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      dbCache = JSON.parse(raw) as MockDb
      return dbCache
    }
  } catch (_e) {
    // ignore parse errors and rebuild
  }
  dbCache = bootstrapDb()
  persist()
  return dbCache
}

function bootstrapDb(): MockDb {
  const db = emptyDb()
  const seedUserId = 'u_seed'
  const seed: UserRow = {
    id: seedUserId,
    email: 'demo@termrepo.dev',
    username: 'demo',
    password: 'demo1234',
    betaStatus: 'approved',
    aiEnabled: true,
    syncEnabled: true,
    tokenValid: true,
    createdAt: '2026-03-10T10:00:00.000Z',
  }
  db.users.push(seed)
  db.beta[seedUserId] = defaultBeta()
  db.tokens[seedUserId] = defaultToken()
  db.sync[seedUserId] = defaultSync()
  db.devices[seedUserId] = defaultDevices()
  db.conflicts[seedUserId] = defaultConflicts()
  db.ai[seedUserId] = defaultAi()
  db.aiUsage[seedUserId] = defaultAiUsage()
  db.ticketsByUser[seedUserId] = defaultTickets()
  return db
}

export function persist() {
  if (!dbCache) return
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(dbCache))
  } catch (_e) {
    // localStorage may be unavailable in some contexts
  }
}

export function getDb(): MockDb {
  return load()
}

export function resetDb() {
  dbCache = bootstrapDb()
  persist()
}

export function newId(prefix: string): string {
  return prefix + '_' + randomString(8)
}

export function issueToken(): string {
  return 'mat_' + randomString(36)
}

export function ensureUserDefaults(userId: string) {
  const db = getDb()
  if (!db.beta[userId]) {
    db.beta[userId] = {
      status: 'none',
      scope: [],
    }
  }
  if (!db.tokens[userId]) db.tokens[userId] = defaultToken()
  if (!db.sync[userId]) db.sync[userId] = { ...defaultSync(), enabled: false, pendingConflicts: 0, lastSyncStatus: 'success' }
  if (!db.devices[userId]) db.devices[userId] = []
  if (!db.conflicts[userId]) db.conflicts[userId] = []
  if (!db.ai[userId]) db.ai[userId] = { ...defaultAi(), enabled: false }
  if (!db.aiUsage[userId]) db.aiUsage[userId] = []
  if (!db.ticketsByUser[userId]) db.ticketsByUser[userId] = []
  persist()
}

export function findUserBySession(headers: Record<string, unknown>): UserRow | null {
  const auth = (headers['Authorization'] || headers['authorization']) as
    | string
    | undefined
  if (!auth) return null
  const token = auth.replace(/^Bearer\s+/i, '')
  const db = getDb()
  const userId = db.sessions[token]
  if (!userId) return null
  return db.users.find((u) => u.id === userId) ?? null
}

export type { UserRow }
export { nowIso, defaultToken }
