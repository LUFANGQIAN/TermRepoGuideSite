import { api } from './http'

export type TicketStatus = 'open' | 'pending' | 'resolved' | 'closed'
export type TicketCategory = 'ai' | 'sync' | 'token' | 'account' | 'other'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface TicketSummary {
  id: string
  title: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  lastReplyAt: string
  createdAt: string
  messageCount: number
}

export interface TicketMessage {
  id: string
  from: 'user' | 'staff'
  authorName: string
  content: string
  attachments: string[]
  createdAt: string
}

export interface TicketDetail {
  id: string
  title: string
  category: TicketCategory
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  messages: TicketMessage[]
}

export interface TicketListResp {
  items: TicketSummary[]
  total: number
  page: number
  pageSize: number
}

export const ticketsApi = {
  list(params: { status?: TicketStatus; page?: number; pageSize?: number } = {}) {
    return api<TicketListResp>({
      url: '/tickets',
      method: 'GET',
      params,
    })
  },

  detail(id: string) {
    return api<TicketDetail>({ url: `/tickets/${id}`, method: 'GET' })
  },

  create(payload: {
    title: string
    category: TicketCategory
    priority: TicketPriority
    content: string
    attachments?: string[]
  }) {
    return api<TicketDetail>({
      url: '/tickets',
      method: 'POST',
      data: payload,
    })
  },

  reply(id: string, content: string) {
    return api<TicketMessage>({
      url: `/tickets/${id}/reply`,
      method: 'POST',
      data: { content, attachments: [] },
    })
  },

  close(id: string) {
    return api<null>({ url: `/tickets/${id}/close`, method: 'POST' })
  },
}
