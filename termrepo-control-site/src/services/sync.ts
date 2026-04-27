import { api } from './http'

export type SyncStatusKind = 'success' | 'conflict' | 'failed' | 'running'

export interface SyncStatus {
  enabled: boolean
  termCount: number
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
    return api<{ items: Device[] }>({ url: '/sync/devices', method: 'GET' })
  },

  removeDevice(id: string) {
    return api<null>({ url: `/sync/devices/${id}`, method: 'DELETE' })
  },

  trigger() {
    return api<SyncJob>({ url: '/sync/trigger', method: 'POST' })
  },

  conflicts() {
    return api<{ items: Conflict[] }>({ url: '/sync/conflicts', method: 'GET' })
  },

  resolveConflict(id: string, resolution: 'local' | 'remote' | 'merge') {
    return api<null>({
      url: `/sync/conflicts/${id}/resolve`,
      method: 'POST',
      data: { resolution },
    })
  },

  exportSnapshot() {
    return api<SyncSnapshotPayload>({
      url: '/sync/snapshot/export',
      method: 'GET',
    })
  },

  importSnapshot(mode: 'overwrite' | 'merge', snapshot: unknown) {
    return api<{ imported: number; skipped: number; snapshotVersion: number }>({
      url: '/sync/snapshot/import',
      method: 'POST',
      data: { mode, snapshot },
    })
  },
}
