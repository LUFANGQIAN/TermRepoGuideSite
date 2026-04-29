import { api } from './http'

export interface AiProviderInfo {
  configured: boolean
  enabled: boolean
  baseUrl: string
  model: string
  hasApiKey: boolean
  lastTestStatus: 'success' | 'failed' | 'untested'
  lastTestMessage: string
  lastTestAt: string | null
  updatedAt: string | null
}

export interface DefaultQuotas {
  aiMonthlyQuota: number
  syncTermLimit: number
}

export interface AdminOverview {
  users: { total: number }
  ai: { totalCalls: number; provider: AiProviderInfo }
  sync: { totalTerms: number }
  defaultQuotas: DefaultQuotas
}

export interface AdminUser {
  id: string
  email: string
  username: string
  role: 'user' | 'admin'
  betaStatus: string
  aiEnabled: boolean
  syncEnabled: boolean
  aiQuota: number
  aiUsed: number
  syncTermLimit: number
  syncTermCount: number
  createdAt: string
}

export interface UserPage {
  total: number
  page: number
  pageSize: number
  items: AdminUser[]
}

export const adminApi = {
  overview() {
    return api<AdminOverview>({ url: '/admin/overview', method: 'GET' })
  },
  aiProvider() {
    return api<AiProviderInfo>({ url: '/admin/ai-provider', method: 'GET' })
  },
  saveAiProvider(data: { enabled: boolean; baseUrl: string; model: string; apiKey?: string }) {
    return api<AiProviderInfo>({ url: '/admin/ai-provider', method: 'PUT', data })
  },
  testAiProvider(data?: { baseUrl?: string; model?: string; apiKey?: string }) {
    return api<AiProviderInfo>({ url: '/admin/ai-provider/test', method: 'POST', data: data ?? {} })
  },
  defaultQuotas() {
    return api<DefaultQuotas>({ url: '/admin/default-quotas', method: 'GET' })
  },
  saveDefaultQuotas(data: DefaultQuotas) {
    return api<DefaultQuotas>({ url: '/admin/default-quotas', method: 'PUT', data })
  },
  users(params: { q?: string; page?: number; pageSize?: number }) {
    return api<UserPage>({ url: '/admin/users', method: 'GET', params })
  },
  updateUser(id: string, data: Partial<Pick<AdminUser, 'aiEnabled' | 'syncEnabled' | 'aiQuota' | 'aiUsed' | 'syncTermLimit' | 'role'>>) {
    return api<AdminUser>({ url: `/admin/users/${id}`, method: 'PATCH', data })
  },
}
