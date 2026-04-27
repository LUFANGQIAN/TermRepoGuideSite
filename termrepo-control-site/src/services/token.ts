import { api } from './http'

export interface TokenInfo {
  token: string
  endpoint: string
  version: string
  valid: boolean
  issuedAt: string
  expiresAt: string
  scopes: string[]
  scopeDescriptions: Record<string, string>
}

export const tokenApi = {
  current() {
    return api<TokenInfo>({ url: '/token/current', method: 'GET' })
  },

  regenerate() {
    return api<TokenInfo>({ url: '/token/regenerate', method: 'POST' })
  },

  validate(token: string) {
    return api<{ valid: boolean; expiresAt: string | null }>({
      url: '/token/validate',
      method: 'POST',
      data: { token },
    })
  },
}
