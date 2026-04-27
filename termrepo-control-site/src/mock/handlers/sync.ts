import { ok, fail, type MockHandler } from '..'
import { findUserBySession, getDb, newId, nowIso, persist } from '../db'
import type { SyncStatus } from '@/services/sync'

function syncOf(userId: string): SyncStatus {
  const cur = getDb().sync[userId]
  if (!cur) throw new Error('sync state not initialized')
  return cur
}

const status: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  return ok(syncOf(user.id))
}

const toggle: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const { enabled } = (req.data ?? {}) as { enabled?: boolean }
  const db = getDb()
  const next: SyncStatus = { ...syncOf(user.id), enabled: !!enabled }
  db.sync[user.id] = next
  persist()
  return ok(next)
}

const devices: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  return ok({ items: getDb().devices[user.id] ?? [] })
}

const removeDevice: MockHandler = (req, match) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const id = match?.[1]
  const db = getDb()
  const list = db.devices[user.id] ?? []
  const idx = list.findIndex((d) => d.id === id)
  if (idx < 0) return fail(40400, '设备不存在', 404)
  if (list[idx]?.current) return fail(40001, '不能移除当前正在使用的设备')
  list.splice(idx, 1)
  persist()
  return ok(null)
}

const trigger: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const db = getDb()
  const cur = syncOf(user.id)
  const next: SyncStatus = {
    ...cur,
    enabled: true,
    lastSyncAt: nowIso(),
    lastSyncStatus: 'success',
    pendingConflicts: 0,
    snapshotVersion: cur.snapshotVersion + 1,
  }
  db.sync[user.id] = next
  db.conflicts[user.id] = []
  persist()
  return ok({
    jobId: newId('job'),
    status: 'success' as const,
    startedAt: nowIso(),
  })
}

const conflicts: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  return ok({ items: getDb().conflicts[user.id] ?? [] })
}

const resolve: MockHandler = (req, match) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const id = match?.[1]
  const db = getDb()
  const list = db.conflicts[user.id] ?? []
  const idx = list.findIndex((c) => c.id === id)
  if (idx < 0) return fail(40400, '冲突不存在', 404)
  list.splice(idx, 1)
  const cur = syncOf(user.id)
  const next: SyncStatus = {
    ...cur,
    pendingConflicts: list.length,
    lastSyncStatus: list.length === 0 ? 'success' : 'conflict',
  }
  db.sync[user.id] = next
  persist()
  return ok(null)
}

const exportSnap: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const cur = syncOf(user.id)
  const sample = ['userIdToken', 'snake_case_handler', 'fetchUserAvatarUrl', 'isFeatureEnabled', 'rgbToHexString', 'splatLab']
  return ok({
    version: cur.snapshotVersion,
    exportedAt: nowIso(),
    terms: Array.from({ length: Math.min(cur.termCount, 6) }).map((_, i) => ({
      id: `tm_${1000 + i}`,
      term: sample[i] ?? `term_${i}`,
      note: '示例备注 ' + (i + 1),
      updatedAt: nowIso(),
    })),
  })
}

const importSnap: MockHandler = (req) => {
  const user = findUserBySession(req.headers)
  if (!user) return fail(40101, '未登录', 401)
  const { mode, snapshot } = (req.data ?? {}) as {
    mode?: 'overwrite' | 'merge'
    snapshot?: { terms?: unknown[] }
  }
  const incoming = Array.isArray(snapshot?.terms) ? snapshot!.terms!.length : 0
  const db = getDb()
  const cur = syncOf(user.id)
  const newCount =
    mode === 'overwrite' ? incoming : cur.termCount + Math.floor(incoming * 0.6)
  const next: SyncStatus = {
    ...cur,
    enabled: true,
    termCount: newCount,
    lastSyncAt: nowIso(),
    lastSyncStatus: 'success',
    snapshotVersion: cur.snapshotVersion + 1,
  }
  db.sync[user.id] = next
  persist()
  return ok({
    imported: incoming,
    skipped: incoming - Math.floor(incoming * 0.6),
    snapshotVersion: next.snapshotVersion,
  })
}

export const syncHandlers = [
  { method: 'GET', pattern: /^\/sync\/status$/, handler: status },
  { method: 'POST', pattern: /^\/sync\/toggle$/, handler: toggle },
  { method: 'GET', pattern: /^\/sync\/devices$/, handler: devices },
  { method: 'DELETE', pattern: /^\/sync\/devices\/(.+)$/, handler: removeDevice },
  { method: 'POST', pattern: /^\/sync\/trigger$/, handler: trigger },
  { method: 'GET', pattern: /^\/sync\/conflicts$/, handler: conflicts },
  { method: 'POST', pattern: /^\/sync\/conflicts\/(.+)\/resolve$/, handler: resolve },
  { method: 'GET', pattern: /^\/sync\/snapshot\/export$/, handler: exportSnap },
  { method: 'POST', pattern: /^\/sync\/snapshot\/import$/, handler: importSnap },
]
