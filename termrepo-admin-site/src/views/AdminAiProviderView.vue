<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiSwitch from '@/components/ui/UiSwitch.vue'
import { adminApi, type AiProviderInfo } from '@/services/admin'
import { useToastStore } from '@/stores/toast'

const toast = useToastStore()
const loading = ref(true)
const saving = ref(false)
const testing = ref(false)
const provider = ref<AiProviderInfo | null>(null)
const form = reactive({ enabled: true, baseUrl: '', model: '', apiKey: '' })

async function load() {
  loading.value = true
  try {
    provider.value = await adminApi.aiProvider()
    form.enabled = provider.value.enabled
    form.baseUrl = provider.value.baseUrl
    form.model = provider.value.model
    form.apiKey = ''
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    provider.value = await adminApi.saveAiProvider({ ...form, apiKey: form.apiKey || undefined })
    form.apiKey = ''
    toast.success('AI 模型配置已保存')
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    saving.value = false
  }
}

async function test() {
  testing.value = true
  try {
    provider.value = await adminApi.testAiProvider({ baseUrl: form.baseUrl, model: form.model, apiKey: form.apiKey || undefined })
    toast.success('模型连接测试成功')
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    testing.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageShell title="AI 模型配置" subtitle="配置全局 OpenAI-compatible 模型端点与 API Key">
    <template #actions>
      <UiBadge :variant="provider?.configured ? 'success' : 'warn'">
        {{ provider?.configured ? '已配置' : '未配置' }}
      </UiBadge>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>
    <section v-else class="card">
      <div class="form-grid">
        <label class="field">
          <span>启用 AI 模型</span>
          <UiSwitch :model-value="form.enabled" @update:model-value="form.enabled = $event" />
        </label>
        <label class="field">
          <span>Base URL</span>
          <input v-model="form.baseUrl" class="input" placeholder="https://api.example.com/v1" />
        </label>
        <label class="field">
          <span>模型名</span>
          <input v-model="form.model" class="input" placeholder="gpt-4o-mini" />
        </label>
        <label class="field">
          <span>API Key</span>
          <input v-model="form.apiKey" class="input" type="password" :placeholder="provider?.hasApiKey ? '已保存，留空则不修改' : '请输入 API Key'" />
        </label>
      </div>
      <div class="row" style="justify-content: space-between; margin-top: 18px">
        <span class="muted">测试状态：{{ provider?.lastTestStatus ?? 'untested' }} {{ provider?.lastTestMessage }}</span>
        <span class="row">
          <button class="button button--ghost" :disabled="testing" @click="test">{{ testing ? '测试中…' : '测试连接' }}</button>
          <button class="button button--dark" :disabled="saving" @click="save">{{ saving ? '保存中…' : '保存配置' }}</button>
        </span>
      </div>
    </section>
  </div>
</template>
