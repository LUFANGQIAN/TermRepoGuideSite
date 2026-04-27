import { api } from './http'

export type BetaStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface BetaInfo {
  status: BetaStatus
  appliedAt?: string
  approvedAt?: string
  scope: string[]
  note?: string
}

export const betaApi = {
  status() {
    return api<BetaInfo>({ url: '/beta/status', method: 'GET' })
  },

  apply(reason: string, scope: string[]) {
    return api<{ status: BetaStatus; appliedAt: string }>({
      url: '/beta/apply',
      method: 'POST',
      data: { reason, scope },
    })
  },
}
