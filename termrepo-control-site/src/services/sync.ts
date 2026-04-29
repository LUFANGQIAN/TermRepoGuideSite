import { api } from './http'

export type SyncStatusKind = 'success' | 'conflict' | 'failed' | 'running'

export interface SyncStatus {
  enabled: boolean
  termCount: number
  termLimit: number
  lastSyncAt: string | null
  lastSyncStatus: SyncStatusKind
  pendingConflicts: number
  snapshotVersion: number
}

export interface Device {
  id: string
  name: string
  platform: string
  current: boolean
  lastActiveAt: string
  registeredAt: string
}

export interface Conflict {
  id: string
  term: string
  localUpdatedAt: string
  remoteUpdatedAt: string
  localValue: { note: string }
  remoteValue: { note: string }
}

export interface SyncJob {
  jobId: string
  status: SyncStatusKind
  startedAt: string
}

export interface SyncSnapshotPayload {
  version: number
  exportedAt: string
  terms: Array<{ id: string; term: string; note: string; updatedAt: string }>
}

export const syncApi = {
  status() {
    return api<SyncStatus>({ url: '/sync/status', method: 'GET' })
  },

  toggle(enabled: boolean) {
    return api<SyncStatus>({
      url: '/sync/toggle',
      method: 'POST',
      data: { enabled },
    })
  },

  devices() {
    return Promise.resolve({ items: [] as Device[] })
  },

  removeDevice(_id: string) {
    return Promise.resolve(null)
  },

  trigger() {
    return Promise.resolve({
      jobId: 'local-refresh',
      status: 'success' as SyncStatusKind,
      startedAt: new Date().toISOString(),
    })
  },

  conflicts() {
    return Promise.resolve({ items: [] as Conflict[] })
  },

  resolveConflict(_id: string, _resolution: 'local' | 'remote' | 'merge') {
    return Promise.resolve(null)
  },

  exportSnapshot() {
    return api<SyncSnapshotPayload>({
      url: '/sync/snapshot/export',
      method: 'GET',
    })
  },

  importSnapshot(mode: 'overwrite' | 'merge', snapshot: unknown) {
    return api<{ imported: number; skipped: number; snapshotVersion: number; termCount: number; termLimit: number }>({
      url: '/sync/snapshot/import',
      method: 'POST',
      data: { mode, snapshot },
    })
  },
}
