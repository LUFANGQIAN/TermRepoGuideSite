<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import {
  syncApi,
  type SyncStatus,
  type Device,
  type Conflict,
} from '@/services/sync'
import { useToastStore } from '@/stores/toast'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime, relativeTime } from '@/utils/format'

const toast = useToastStore()
const auth = useAuthStore()

const status = ref<SyncStatus | null>(null)
const devices = ref<Device[]>([])
const conflicts = ref<Conflict[]>([])
const loading = ref(true)
const triggering = ref(false)
const importing = ref(false)
const importMode = ref<'overwrite' | 'merge'>('merge')
const importInput = ref<HTMLInputElement | null>(null)

const lastStatusVariant = computed(() => {
  switch (status.value?.lastSyncStatus) {
    case 'success':
      return 'success' as const
    case 'conflict':
      return 'warn' as const
    case 'failed':
      return 'danger' as const
    case 'running':
      return 'info' as const
    default:
      return 'muted' as const
  }
})

const lastStatusLabel = computed(() => {
  switch (status.value?.lastSyncStatus) {
    case 'success':
      return '成功'
    case 'conflict':
      return '存在冲突'
    case 'failed':
      return '失败'
    case 'running':
      return '同步中'
    default:
      return '—'
  }
})

async function loadAll() {
  loading.value = true
  try {
    const [s, d, c] = await Promise.all([
      syncApi.status(),
      syncApi.devices(),
      syncApi.conflicts(),
    ])
    status.value = s
    devices.value = d.items
    conflicts.value = c.items
  } finally {
    loading.value = false
  }
}

async function onToggle(v: boolean) {
  try {
    status.value = await syncApi.toggle(v)
    auth.patchUser({ syncEnabled: v })
    toast.success(v ? '云同步已启用' : '云同步已关闭')
  } catch (e) {
    toast.error((e as Error).message)
  }
}

async function trigger() {
  triggering.value = true
  try {
    await syncApi.trigger()
    toast.success('同步任务已完成')
    await loadAll()
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    triggering.value = false
  }
}

async function removeDevice(id: string) {
  if (!confirm('确认移除该设备？该设备将无法继续同步。')) return
  try {
    await syncApi.removeDevice(id)
    toast.success('设备已移除')
    await loadAll()
  } catch (e) {
    toast.error((e as Error).message)
  }
}

async function resolve(id: string, resolution: 'local' | 'remote' | 'merge') {
  try {
    await syncApi.resolveConflict(id, resolution)
    toast.success('冲突已解决')
    await loadAll()
  } catch (e) {
    toast.error((e as Error).message)
  }
}

async function exportSnapshot() {
  try {
    const snap = await syncApi.exportSnapshot()
    const blob = new Blob([JSON.stringify(snap, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `termrepo-snapshot-v${snap.version}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('云端快照已导出')
  } catch (e) {
    toast.error((e as Error).message)
  }
}

function pickImport() {
  importInput.value?.click()
}

async function onImportFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  importing.value = true
  try {
    const text = await file.text()
    const json = JSON.parse(text)
    const r = await syncApi.importSnapshot(importMode.value, json)
    toast.success(`导入完成：${r.imported} 条`)
    await loadAll()
  } catch (e) {
    toast.error('导入失败：' + (e as Error).message)
  } finally {
    importing.value = false
    if (importInput.value) importInput.value.value = ''
  }
}

onMounted(loadAll)
</script>

<template>
  <PageShell title="云同步" subtitle="管理同步开关、设备、冲突与快照">
    <template #actions>
      <button
        class="button button--ghost"
        :disabled="!status?.enabled || triggering"
        @click="trigger"
      >
        {{ triggering ? '同步中…' : '手动同步' }}
      </button>
      <button class="button button--ghost" @click="exportSnapshot">
        导出快照
      </button>
      <button
        class="button button--dark"
        :disabled="importing"
        @click="pickImport"
      >
        {{ importing ? '导入中…' : '导入快照' }}
      </button>
      <input
        ref="importInput"
        type="file"
        accept="application/json"
        style="display: none"
        @change="onImportFile"
      />
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>

    <template v-else-if="status">
      <section class="card-grid card-grid--4">
        <div class="metric-card">
          <span class="metric-card__label">
            同步开关
            <UiBadge :variant="status.enabled ? 'success' : 'muted'">
              {{ status.enabled ? '已启用' : '未启用' }}
            </UiBadge>
          </span>
          <div class="row" style="margin-top: 4px">
            <UiSwitch
              :model-value="status.enabled"
              @update:model-value="onToggle"
            />
            <span class="muted" style="font-size: 12.5px">
              关闭后插件继续保留本地词库
            </span>
          </div>
        </div>
        <div class="metric-card">
          <span class="metric-card__label">同步词库数量</span>
          <span class="metric-card__value">
            {{ status.termCount }}
            <span class="muted" style="font-size: 14px; font-weight: 500;">
              / {{ status.termLimit }}
            </span>
          </span>
          <span class="metric-card__hint">
            快照版本 v{{ status.snapshotVersion }}
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-card__label">最近一次同步</span>
          <span class="metric-card__value" style="font-size: 18px">
            {{ relativeTime(status.lastSyncAt) }}
          </span>
          <span class="metric-card__hint">
            {{ formatDateTime(status.lastSyncAt) }}
          </span>
        </div>
        <div class="metric-card">
          <span class="metric-card__label">
            最近状态
            <UiBadge :variant="lastStatusVariant">{{ lastStatusLabel }}</UiBadge>
          </span>
          <span class="metric-card__value" style="font-size: 18px">
            {{ status.pendingConflicts }} 个冲突
          </span>
          <span class="metric-card__hint">需手动解决，否则插件不会推送本地变更</span>
        </div>
      </section>

      <section class="card" style="margin-top: 24px">
        <header class="card__head">
          <div>
            <h3 class="card__title">设备列表</h3>
            <p class="card__sub">
              已绑定该账户、参与同步的设备。
            </p>
          </div>
        </header>

        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>设备</th>
                <th>平台</th>
                <th>最近活跃</th>
                <th>注册时间</th>
                <th style="text-align: right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="d in devices" :key="d.id">
                <td>
                  <div class="row">
                    <span style="font-weight: 500">{{ d.name }}</span>
                    <UiBadge v-if="d.current" variant="info">当前</UiBadge>
                  </div>
                </td>
                <td><code>{{ d.platform }}</code></td>
                <td>{{ formatDateTime(d.lastActiveAt) }}</td>
                <td>{{ formatDateTime(d.registeredAt) }}</td>
                <td style="text-align: right">
                  <button
                    class="button button--danger button--small"
                    :disabled="d.current"
                    @click="removeDevice(d.id)"
                  >
                    移除
                  </button>
                </td>
              </tr>
              <tr v-if="devices.length === 0">
                <td colspan="5">
                  <div class="empty">
                    <span class="empty__title">暂无设备</span>
                    <span>插件粘贴 token 后会自动出现在此处</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card" style="margin-top: 24px">
        <header class="card__head">
          <div>
            <h3 class="card__title">冲突解决</h3>
            <p class="card__sub">
              本地与云端在同一术语上同时被修改时会进入冲突状态，请逐项处理。
            </p>
          </div>
          <UiBadge :variant="conflicts.length === 0 ? 'success' : 'warn'">
            {{ conflicts.length }} 个待处理
          </UiBadge>
        </header>

        <div v-if="conflicts.length === 0" class="empty">
          <span class="empty__title">没有冲突</span>
          <span>所有变更都已和云端保持一致</span>
        </div>

        <div v-else style="display: grid; gap: 12px">
          <article
            v-for="cf in conflicts"
            :key="cf.id"
            style="padding: 16px; border-radius: var(--ds-radius-md); background: var(--ds-background-100); box-shadow: var(--ds-shadow-border);"
          >
            <header class="row row--between" style="margin-bottom: 10px">
              <div class="row">
                <code style="font-weight: 600">{{ cf.term }}</code>
                <UiBadge variant="warn">冲突</UiBadge>
              </div>
              <span class="muted" style="font-size: 12px">
                本地 {{ formatDateTime(cf.localUpdatedAt) }} · 云端
                {{ formatDateTime(cf.remoteUpdatedAt) }}
              </span>
            </header>
            <div class="card-grid card-grid--2">
              <div>
                <div class="muted" style="font-size: 12px; margin-bottom: 4px">
                  本地版本
                </div>
                <div
                  style="padding: 10px; background: #fff; border-radius: var(--ds-radius-sm); box-shadow: var(--ds-shadow-border);"
                >
                  {{ cf.localValue.note }}
                </div>
              </div>
              <div>
                <div class="muted" style="font-size: 12px; margin-bottom: 4px">
                  云端版本
                </div>
                <div
                  style="padding: 10px; background: #fff; border-radius: var(--ds-radius-sm); box-shadow: var(--ds-shadow-border);"
                >
                  {{ cf.remoteValue.note }}
                </div>
              </div>
            </div>
            <div class="row" style="justify-content: flex-end; margin-top: 12px;">
              <button class="button button--ghost button--small" @click="resolve(cf.id, 'local')">
                保留本地
              </button>
              <button class="button button--ghost button--small" @click="resolve(cf.id, 'remote')">
                保留云端
              </button>
              <button class="button button--dark button--small" @click="resolve(cf.id, 'merge')">
                自动合并
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="card" style="margin-top: 24px">
        <header class="card__head">
          <div>
            <h3 class="card__title">快照导入选项</h3>
            <p class="card__sub">
              「合并」会保留两侧条目；「覆盖」会用快照完全替换云端词库
            </p>
          </div>
        </header>
        <div class="row row--wrap">
          <label class="row" style="gap: 6px;">
            <input
              type="radio"
              v-model="importMode"
              value="merge"
            />
            <span>合并 · 推荐</span>
          </label>
          <label class="row" style="gap: 6px;">
            <input
              type="radio"
              v-model="importMode"
              value="overwrite"
            />
            <span>覆盖云端</span>
          </label>
        </div>
      </section>
    </template>
  </div>
</template>
