<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const route = useRoute()

const email = ref('demo@termrepo.dev')
const password = ref('demo1234')
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
      <span>TermRepo · 控制台</span>
    </div>
    <h1 class="auth-card__title">登录</h1>
    <p class="auth-card__sub">
      使用 TermRepo 账户登录，管理 token、云同步与 AI 能力
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
        {{ auth.loading ? '登录中…' : '登录' }}
      </button>

      <p class="auth-card__sub" style="margin-top: 4px; font-size: 12px;">
        演示账号：demo@termrepo.dev / demo1234
      </p>
    </form>

    <p class="auth-card__footer">
      还没有账号？
      <RouterLink :to="{ name: 'register' }">立即注册</RouterLink>
    </p>
  </div>
</template>
