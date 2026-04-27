<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()

const email = ref('')
const username = ref('')
const password = ref('')
const errorMsg = ref('')

async function submit() {
  errorMsg.value = ''
  if (password.value.length < 6) {
    errorMsg.value = '密码至少 6 位'
    return
  }
  try {
    await auth.register(email.value.trim(), password.value, username.value.trim())
    toast.success('注册成功')
    router.replace({ name: 'dashboard' })
  } catch (e) {
    const err = e as Error
    errorMsg.value = err.message || '注册失败'
  }
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-card__brand">
      <span class="auth-card__brand-dot" />
      <span>TermRepo · 控制台</span>
    </div>
    <h1 class="auth-card__title">创建账户</h1>
    <p class="auth-card__sub">
      注册仅用于管理 token / 云同步 / AI 等增强能力，本地词库不受影响。
    </p>

    <form class="auth-card__form" @submit.prevent="submit">
      <label class="field">
        <span class="field__label">邮箱</span>
        <input
          v-model="email"
          class="input"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
        />
      </label>
      <label class="field">
        <span class="field__label">用户名</span>
        <input
          v-model="username"
          class="input"
          type="text"
          required
          autocomplete="username"
          placeholder="display name"
        />
      </label>
      <label class="field">
        <span class="field__label">密码</span>
        <input
          v-model="password"
          class="input"
          type="password"
          required
          autocomplete="new-password"
          minlength="6"
          placeholder="至少 6 位"
        />
      </label>

      <p v-if="errorMsg" class="field__error">{{ errorMsg }}</p>

      <button
        type="submit"
        class="button button--dark button--block"
        :disabled="auth.loading"
      >
        {{ auth.loading ? '提交中…' : '创建账户' }}
      </button>
    </form>

    <p class="auth-card__footer">
      已经有账户？
      <RouterLink :to="{ name: 'login' }">立即登录</RouterLink>
    </p>
  </div>
</template>
