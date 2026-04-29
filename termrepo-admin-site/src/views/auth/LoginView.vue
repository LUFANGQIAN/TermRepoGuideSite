<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const errorMsg = ref('')

async function submit() {
  errorMsg.value = ''
  try {
    await auth.login(email.value.trim(), password.value)
    toast.success('登录成功')
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.replace(redirect)
  } catch (e) {
    const err = e as Error
    errorMsg.value = err.message || '登录失败'
  }
}
</script>

<template>
  <div class="auth-card">
    <div class="auth-card__brand">
      <span class="auth-card__brand-dot" />
      <span>TermRepo · 管理站</span>
    </div>
    <h1 class="auth-card__title">管理员登录</h1>
    <p class="auth-card__sub">
      使用后端 .env 中初始化的管理员账号登录，配置 AI 模型、默认额度与用户权限
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
        <span class="field__label">密码</span>
        <input
          v-model="password"
          class="input"
          type="password"
          required
          autocomplete="current-password"
          minlength="8"
          placeholder="至少 8 位"
        />
      </label>

      <p v-if="errorMsg" class="field__error">{{ errorMsg }}</p>

      <button
        type="submit"
        class="button button--dark button--block"
        :disabled="auth.loading"
      >
        {{ auth.loading ? '登录中…' : '登录' }}
      </button>

    </form>
  </div>
</template>
