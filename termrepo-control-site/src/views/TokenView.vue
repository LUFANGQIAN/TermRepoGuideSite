<script setup lang="ts">
import { onMounted, ref } from 'vue'
import PageShell from '@/components/ui/PageShell.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import CopyableCode from '@/components/ui/CopyableCode.vue'
import { tokenApi, type TokenInfo } from '@/services/token'
import { useToastStore } from '@/stores/toast'
import { formatDateTime, daysUntil } from '@/utils/format'

const toast = useToastStore()
const info = ref<TokenInfo | null>(null)
const loading = ref(true)
const regenerating = ref(false)
const showRegen = ref(false)

async function load() {
  loading.value = true
  try {
    info.value = await tokenApi.current()
  } finally {
    loading.value = false
  }
}

async function regenerate() {
  regenerating.value = true
  try {
    info.value = await tokenApi.regenerate()
    toast.success('Token 已重新生成，旧 token 已失效')
    showRegen.value = false
  } catch (e) {
    toast.error((e as Error).message)
  } finally {
    regenerating.value = false
  }
}

async function validate() {
  if (!info.value) return
  try {
    const r = await tokenApi.validate(info.value.token)
    if (r.valid) toast.success('Token 校验通过')
    else toast.error('Token 已失效')
  } catch (e) {
    toast.error((e as Error).message)
  }
}

onMounted(load)
</script>

<template>
  <PageShell title="Token" subtitle="将 token 粘贴到 VS Code 插件即可接入云能力">
    <template #actions>
      <button class="button button--ghost" :disabled="loading" @click="validate">
        校验 token
      </button>
      <button class="button button--dark" @click="showRegen = true">
        重新生成
      </button>
    </template>
  </PageShell>

  <div class="page-shell" style="padding-top: 0">
    <div v-if="loading" class="empty">加载中…</div>

    <div v-else-if="info" class="card-grid" style="grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px;">
      <section class="card">
        <header class="card__head">
          <div>
            <h3 class="card__title">当前 Token</h3>
            <p class="card__sub">
              妥善保管，泄露后请立即点击「重新生成」
            </p>
          </div>
          <UiBadge :variant="info.valid ? 'success' : 'danger'">
            {{ info.valid ? '有效' : '失效' }}
          </UiBadge>
        </header>

        <div class="section-title">凭证</div>
        <CopyableCode :value="info.token" label="Token" mask />

        <div class="divider" />
        <div class="section-title">接入信息</div>
        <CopyableCode :value="info.endpoint" label="接口地址" />

        <div class="meta-list" style="margin-top: 12px">
          <div class="meta-list__row">
            <span class="meta-list__label">API 版本</span>
            <span><code>{{ info.version }}</code></span>
          </div>
          <div class="meta-list__row">
            <span class="meta-list__label">签发时间</span>
            <span>{{ formatDateTime(info.issuedAt) }}</span>
          </div>
          <div class="meta-list__row">
            <span class="meta-list__label">到期时间</span>
            <span>
              {{ formatDateTime(info.expiresAt) }}
              <span class="muted" style="margin-left: 6px">
                · 剩余 {{ daysUntil(info.expiresAt) }} 天
              </span>
            </span>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card__head">
          <div>
            <h3 class="card__title">权限范围</h3>
            <p class="card__sub">scope 决定 token 可调用哪些云接口</p>
          </div>
        </header>

        <ul style="display: grid; gap: 12px; list-style: none;">
          <li
            v-for="s in info.scopes"
            :key="s"
            style="display: grid; gap: 4px; padding: 12px 14px; border-radius: var(--ds-radius-md); background: var(--ds-background-100); box-shadow: var(--ds-shadow-border);"
          >
            <span class="row" style="justify-content: space-between;">
              <span class="scope-pill">{{ s }}</span>
              <UiBadge variant="info">已授权</UiBadge>
            </span>
            <span class="muted" style="font-size: 12.5px;">
              {{ info.scopeDescriptions[s] ?? '—' }}
            </span>
          </li>
        </ul>
      </section>
    </div>

    <section class="card" style="margin-top: 16px">
      <header class="card__head">
        <div>
          <h3 class="card__title">在 VS Code 插件中使用</h3>
          <p class="card__sub">复制下方命令并粘贴到插件配置面板</p>
        </div>
      </header>
      <CopyableCode
        :value="`termrepo.cloud.token=${info?.token ?? ''}`"
        label="配置项"
      />
      <p class="muted" style="margin-top: 10px; font-size: 12.5px">
        若使用配置文件，可在 <code>termrepo.config.json</code> 中加入
        <code>{ &quot;cloud&quot;: { &quot;token&quot;: &quot;{token}&quot; } }</code>
      </p>
    </section>
  </div>

  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showRegen" class="modal-mask" @click.self="showRegen = false">
        <div class="modal">
          <h3 class="modal__title">重新生成 Token？</h3>
          <p class="modal__sub">
            旧 token 会立即失效。所有已粘贴旧 token 的设备将无法访问云能力，需要重新粘贴新 token。
          </p>
          <div class="modal__footer">
            <button class="button button--ghost" @click="showRegen = false">取消</button>
            <button
              class="button button--danger"
              :disabled="regenerating"
              @click="regenerate"
            >
              {{ regenerating ? '生成中…' : '确认重新生成' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
