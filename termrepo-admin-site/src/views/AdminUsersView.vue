<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import { adminApi, type AdminUser, type UserPage } from '@/services/admin'
import { useToastStore } from '@/stores/toast'
import { formatDateTime } from '@/utils/format'

const toast = useToastStore()
const loading = ref(true)
const savingId = ref('')
const q = ref('')
const page = ref<UserPage | null>(null)

async function load() {
  loading.value = true
  try {
    page.value = await adminApi.users({ q: q.value, page: 1, pageSize: 50 })
  } finally {
    loading.value = false
  }
}

async function saveUser(user: AdminUser) {
  savingId.value = user.id
  try {
    const updated = await adminApi.updateUser(user.id, {
      aiEnabled: user.aiEnabled,
      syncEnabled: user.syncEnabled,
      aiQuota: user.aiQuota,
      aiUsed: user.aiUsed,
      syncTermLimit: user.syncTermLimit,
      role: user.role,
    })
    if (page.value) {
      const index = page.value.items.findIndex((item) => item.id === user.id)
      if (index >= 0) page.value.items[index] = updated
    }
    toast.success('用户配置已保存')
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    savingId.value = ''
  }
}

onMounted(load)
</script>

<template>
  <PageShell title="用户管理" subtitle="调整账号角色、AI 额度和云同步词条上限">
    <template #actions>
      <input v-model="q" class="input" placeholder="搜索邮箱或昵称" style="width: 220px" @keyup.enter="load" />
      <button class="button button--ghost" @click="load">搜索</button>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>
    <section v-else class="card">
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>用户</th>
              <th>角色</th>
              <th>AI</th>
              <th>同步</th>
              <th>创建时间</th>
              <th style="text-align: right">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in page?.items" :key="u.id">
              <td>
                <div style="font-weight: 500">{{ u.username }}</div>
                <div class="muted">{{ u.email }}</div>
              </td>
              <td>
                <select v-model="u.role" class="select">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td>
                <div class="row">
                  <UiSwitch :model-value="u.aiEnabled" @update:model-value="u.aiEnabled = $event" />
                  <input v-model.number="u.aiUsed" class="input" type="number" min="0" style="width: 82px" />
                  <span>/</span>
                  <input v-model.number="u.aiQuota" class="input" type="number" min="0" style="width: 92px" />
                </div>
              </td>
              <td>
                <div class="row">
                  <UiSwitch :model-value="u.syncEnabled" @update:model-value="u.syncEnabled = $event" />
                  <span>{{ u.syncTermCount }} /</span>
                  <input v-model.number="u.syncTermLimit" class="input" type="number" min="0" style="width: 92px" />
                </div>
              </td>
              <td>{{ formatDateTime(u.createdAt) }}</td>
              <td style="text-align: right">
                <button class="button button--dark button--small" :disabled="savingId === u.id" @click="saveUser(u)">
                  {{ savingId === u.id ? '保存中…' : '保存' }}
                </button>
              </td>
            </tr>
            <tr v-if="page?.items.length === 0">
              <td colspan="6"><div class="empty"><span class="empty__title">暂无用户</span></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="row" style="justify-content: space-between; margin-top: 14px">
        <UiBadge variant="muted">共 {{ page?.total ?? 0 }} 个用户</UiBadge>
      </div>
    </section>
  </div>
</template>
