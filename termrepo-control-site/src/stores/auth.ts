import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type User } from '@/services/auth'

const TOKEN_KEY = 'trp.access_token'
const REFRESH_KEY = 'trp.refresh_token'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY))
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!accessToken.value)

  function setTokens(at: string | null, rt: string | null) {
    accessToken.value = at
    refreshToken.value = rt
    if (at) localStorage.setItem(TOKEN_KEY, at)
    else localStorage.removeItem(TOKEN_KEY)
    if (rt) localStorage.setItem(REFRESH_KEY, rt)
    else localStorage.removeItem(REFRESH_KEY)
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const r = await authApi.login(email, password)
      setTokens(r.accessToken, r.refreshToken)
      await fetchMe()
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, username: string) {
    loading.value = true
    try {
      const r = await authApi.register(email, password, username)
      setTokens(r.accessToken, r.refreshToken)
      await fetchMe()
    } finally {
      loading.value = false
    }
  }

  async function fetchMe() {
    if (!accessToken.value) {
      user.value = null
      initialized.value = true
      return
    }
    try {
      user.value = await authApi.me()
    } catch (_e) {
      setTokens(null, null)
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function logout() {
    try {
      if (accessToken.value) await authApi.logout()
    } catch (_e) {
      // ignore
    } finally {
      setTokens(null, null)
      user.value = null
    }
  }

  function patchUser(patch: Partial<User>) {
    if (!user.value) return
    user.value = { ...user.value, ...patch }
  }

  return {
    accessToken,
    refreshToken,
    user,
    initialized,
    loading,
    isLoggedIn,
    login,
    register,
    fetchMe,
    logout,
    patchUser,
  }
})
