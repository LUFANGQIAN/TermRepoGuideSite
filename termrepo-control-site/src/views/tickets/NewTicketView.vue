<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import PageShell from '@/components/ui/PageShell.vue'
import {
  ticketsApi,
  type TicketCategory,
  type TicketPriority,
} from '@/services/tickets'
import { useToastStore } from '@/stores/toast'

const router = useRouter()
const toast = useToastStore()

const title = ref('')
const category = ref<TicketCategory>('other')
const priority = ref<TicketPriority>('normal')
const content = ref('')
const submitting = ref(false)

async function submit() {
  if (!title.value.trim() || !content.value.trim()) {
    toast.error('请填写工单标题与描述')
    return
  }
  submitting.value = true
  try {
    const t = await ticketsApi.create({
      title: title.value.trim(),
      category: category.value,
      priority: priority.value,
      content: content.value.trim(),
    })
    toast.success('工单已提交')
    router.replace({ name: 'ticket-detail', params: { id: t.id } })
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <PageShell title="新建工单" subtitle="清晰描述问题与复现步骤可以加快处理速度">
    <template #actions>
      <RouterLink class="button button--ghost" :to="{ name: 'tickets' }">
        返回列表
      </RouterLink>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <section class="card" style="max-width: 720px">
      <div style="display: grid; gap: 14px">
        <label class="field">
          <span class="field__label">标题</span>
          <input
            v-model="title"
            class="input"
            type="text"
            maxlength="80"
            placeholder="一句话概括问题"
          />
        </label>

        <div class="card-grid card-grid--2">
          <label class="field">
            <span class="field__label">分类</span>
            <select v-model="category" class="select">
              <option value="ai">AI 能力</option>
              <option value="sync">云同步</option>
              <option value="token">Token</option>
              <option value="account">账户</option>
              <option value="other">其它</option>
            </select>
          </label>
          <label class="field">
            <span class="field__label">优先级</span>
            <select v-model="priority" class="select">
              <option value="low">低</option>
              <option value="normal">普通</option>
              <option value="high">高</option>
              <option value="urgent">紧急</option>
            </select>
          </label>
        </div>

        <label class="field">
          <span class="field__label">描述</span>
          <textarea
            v-model="content"
            class="textarea"
            rows="8"
            placeholder="请描述：现象、复现步骤、期望结果、报错截图链接（可选）"
          />
          <span class="field__hint">
            提示：包含插件版本、操作系统、网络环境会让排查更快
          </span>
        </label>

        <div class="row" style="justify-content: flex-end">
          <RouterLink class="button button--ghost" :to="{ name: 'tickets' }">
            取消
          </RouterLink>
          <button
            class="button button--dark"
            :disabled="submitting"
            @click="submit"
          >
            {{ submitting ? '提交中…' : '提交工单' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>
