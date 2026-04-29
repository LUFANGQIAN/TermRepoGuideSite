import { api } from './http'

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketCategory = 'ai' | 'sync' | 'token' | 'account' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TicketUser {
  id: string
  email: string
  username: string
}

export interface TicketSummary {
  id: string
  title: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  lastReplyAt: string
  createdAt: string
  messageCount: number
  user?: TicketUser
}

export interface TicketMessage {
  id: string
  from: 'user' | 'staff'
  authorName: string
  content: string
  attachments: string[]
  createdAt: string
}

export interface TicketDetail extends TicketSummary {
  updatedAt: string
  messages: TicketMessage[]
}

export interface TicketListResp {
  items: TicketSummary[]
  total: number
  page: number
  pageSize: number
}

export const adminTicketsApi = {
  list(params: { status?: TicketStatus | ''; q?: string; page?: number; pageSize?: number } = {}) {
    return api<TicketListResp>({ url: '/admin/tickets', method: 'GET', params })
  },
  detail(id: string) {
    return api<TicketDetail>({ url: `/admin/tickets/${id}`, method: 'GET' })
  },
  reply(id: string, content: string, status: TicketStatus = 'pending') {
    return api<TicketMessage>({ url: `/admin/tickets/${id}/reply`, method: 'POST', data: { content, status, attachments: [] } })
  },
  update(id: string, data: { status?: TicketStatus; priority?: TicketPriority }) {
    return api<TicketDetail>({ url: `/admin/tickets/${id}`, method: 'PATCH', data })
  },
}
