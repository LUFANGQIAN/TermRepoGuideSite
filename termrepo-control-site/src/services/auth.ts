import { api } from './http'

export interface User {
  id: string
  email: string
  username: string
  betaStatus: 'none' | 'pending' | 'approved' | 'rejected'
  aiEnabled: boolean
  syncEnabled: boolean
  tokenValid: boolean
  createdAt: string
}

export interface AuthResp {
  accessToken: string
  refreshToken: string
  user: Pick<User, 'id' | 'email' | 'username' | 'createdAt'>
}

export const authApi = {
  login(email: string, password: string) {
    return api<AuthResp>({
      url: '/auth/login',
      method: 'POST',
      data: { email, password },
    })
  },

  register(email: string, password: string, username: string) {
    return api<AuthResp>({
      url: '/auth/register',
      method: 'POST',
      data: { email, password, username },
    })
  },

  me() {
    return api<User>({ url: '/auth/me', method: 'GET' })
  },

  logout() {
    return api<null>({ url: '/auth/logout', method: 'POST' })
  },
}
