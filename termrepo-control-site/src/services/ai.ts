import { api } from './http'

export interface AiStatus {
  enabled: boolean
  model: string
  quota: {
    weekly: { limit: number; used: number }
    monthly: { limit: number; used: number }
  }
  resetAt: {
    weekly: string
    monthly: string
  }
}

export interface AiUsageItem {
  id: string
  calledAt: string
  kind: 'annotate' | 'split-suggest' | 'rename'
  input: string
  outputPreview: string
  latencyMs: number
  success: boolean
}

export interface AiUsage {
  summary: {
    totalCalls: number
    successRate: number
    avgLatencyMs: number
  }
  items: AiUsageItem[]
}

export const aiApi = {
  status() {
    return api<AiStatus>({ url: '/ai/status', method: 'GET' })
  },

  toggle(enabled: boolean) {
    return api<AiStatus>({
      url: '/ai/toggle',
      method: 'POST',
      data: { enabled },
    })
  },

  usage(range: '24h' | '7d' | '30d') {
    return api<AiUsage>({
      url: '/ai/usage',
      method: 'GET',
      params: { range },
    })
  },
}
