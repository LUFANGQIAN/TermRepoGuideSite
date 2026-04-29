import { api } from './http'

export interface User {
  id: string
  email: string
  username: string
  role: 'user' | 'admin'
  betaStatus: 'none' | 'pending' | 'approved' | 'rejected'
  aiEnabled: boolean
  syncEnabled: boolean
  syncTermLimit: number
  tokenValid: boolean
  createdAt: string
}

export interface AuthResp {
  accessToken: string
  refreshToken: string
  user: Pick<User, 'id' | 'email' | 'username' | 'role' | 'createdAt'>
}

export const authApi = {
  login(email: string, password: string) {
    return api<AuthResp>({ url: '/auth/login', method: 'POST', data: { email, password } })
  },
  me() {
    return api<User>({ url: '/auth/me', method: 'GET' })
  },
  logout(refreshToken?: string | null) {
    return api<null>({ url: '/auth/logout', method: 'POST', data: { refreshToken } })
  },
}
