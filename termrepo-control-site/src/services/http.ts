import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { handleMock } from '@/mock'

export interface ApiEnvelope<T = unknown> {
  code: number
  message: string
  data: T
}

const useMock = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false'

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000,
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('trp.access_token')
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

http.interceptors.response.use(
  (resp: AxiosResponse<ApiEnvelope>) => resp,
  (err) => Promise.reject(err),
)

function parseBody(data: unknown): unknown {
  if (typeof data !== 'string') return data
  if (data.length === 0) return null
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

if (useMock) {
  http.interceptors.request.use(async (config) => {
    const adapter = async (cfg: AxiosRequestConfig): Promise<AxiosResponse<ApiEnvelope>> => {
      const result = await handleMock({
        method: (cfg.method ?? 'get').toUpperCase(),
        url: cfg.url ?? '',
        params: cfg.params ?? {},
        data: parseBody(cfg.data ?? null),
        headers: (cfg.headers ?? {}) as Record<string, unknown>,
      })

      return {
        data: result.body,
        status: result.status,
        statusText: 'OK',
        headers: {},
        config: cfg as InternalAxiosRequestConfig,
      } as AxiosResponse<ApiEnvelope>
    }
    config.adapter = adapter
    return config
  })
}

export function setupHttp() {
  // reserve for future global side-effects (e.g. global 401 handler)
}

export async function api<T = unknown>(
  config: AxiosRequestConfig,
): Promise<T> {
  const resp = await http.request<ApiEnvelope<T>>(config)
  const env = resp.data
  if (env.code !== 0) {
    const err = new Error(env.message ?? 'request failed') as Error & {
      code?: number
      data?: unknown
    }
    err.code = env.code
    err.data = env.data
    throw err
  }
  return env.data
}
