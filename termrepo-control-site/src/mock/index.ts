import type { ApiEnvelope } from '@/services/http'
import { authHandlers } from './handlers/auth'
import { betaHandlers } from './handlers/beta'
import { tokenHandlers } from './handlers/token'
import { syncHandlers } from './handlers/sync'
import { aiHandlers } from './handlers/ai'
import { ticketsHandlers } from './handlers/tickets'

export interface MockReq {
  method: string
  url: string
  params: Record<string, unknown>
  data: unknown
  headers: Record<string, unknown>
}

export interface MockResp {
  status: number
  body: ApiEnvelope
}

export type MockHandler = (
  req: MockReq,
  match: RegExpMatchArray | null,
) => Promise<MockResp> | MockResp

interface Route {
  method: string
  pattern: RegExp
  handler: MockHandler
}

const routes: Route[] = [
  ...authHandlers,
  ...betaHandlers,
  ...tokenHandlers,
  ...syncHandlers,
  ...aiHandlers,
  ...ticketsHandlers,
  {
    method: 'GET',
    pattern: /^\/health$/,
    handler: () => ok({
      status: 'up',
      time: new Date().toISOString(),
    }),
  },
]

function normalizeUrl(url: string): string {
  const cleaned = url.replace(/^https?:\/\/[^/]+/, '')
  const noBase = cleaned.replace(/^\/api\/v1/, '')
  const noQuery = noBase.split('?')[0] ?? ''
  return noQuery.startsWith('/') ? noQuery : '/' + noQuery
}

const NETWORK_LATENCY_MS = 220

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function handleMock(req: MockReq): Promise<MockResp> {
  await delay(NETWORK_LATENCY_MS)

  const path = normalizeUrl(req.url)
  const method = req.method.toUpperCase()

  for (const route of routes) {
    if (route.method !== method) continue
    const match = path.match(route.pattern)
    if (!match) continue
    try {
      return await route.handler({ ...req, url: path }, match)
    } catch (e) {
      const err = e as Error & { code?: number; status?: number }
      return {
        status: err.status ?? 200,
        body: { code: err.code ?? 50001, message: err.message ?? 'mock error', data: null },
      }
    }
  }

  return {
    status: 404,
    body: { code: 40400, message: `mock: route not found ${method} ${path}`, data: null },
  }
}

export function ok<T>(data: T, message = 'ok'): MockResp {
  return { status: 200, body: { code: 0, message, data: data as unknown } }
}

export function fail(code: number, message: string, status = 200): MockResp {
  return { status, body: { code, message, data: null } }
}
