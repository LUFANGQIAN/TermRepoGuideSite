<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import { adminApi } from '@/services/admin'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const form = reactive({ aiMonthlyQuota: 100, syncTermLimit: 500 })

async function load() {
  loading.value = true
  try {
    const quotas = await adminApi.defaultQuotas()
    form.aiMonthlyQuota = quotas.aiMonthlyQuota
    form.syncTermLimit = quotas.syncTermLimit
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const quotas = await adminApi.saveDefaultQuotas({ ...form })
    form.aiMonthlyQuota = quotas.aiMonthlyQuota
    form.syncTermLimit = quotas.syncTermLimit
    toast.success('默认额度已保存')
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageShell title="默认额度" subtitle="设置开放注册用户的初始 AI 与云同步额度" />
  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>
    <section v-else class="card">
      <div class="form-grid">
        <label class="field">
          <span>新用户 AI 月额度</span>
          <input v-model.number="form.aiMonthlyQuota" class="input" type="number" min="0" />
        </label>
        <label class="field">
          <span>新用户云同步词条上限</span>
          <input v-model.number="form.syncTermLimit" class="input" type="number" min="0" />
        </label>
      </div>
      <div class="row" style="justify-content: flex-end; margin-top: 18px">
        <button class="button button--dark" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存默认额度' }}</button>
      </div>
    </section>
  </div>
</template>
