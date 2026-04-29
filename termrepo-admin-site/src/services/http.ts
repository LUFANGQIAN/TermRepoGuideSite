import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'

export interface ApiEnvelope<T = unknown> {
  code: number
  message: string
  data: T
}

const apiBaseURL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.DEV ? 'http://localhost:3000/api/v1' : '')

export const http: AxiosInstance = axios.create({
  baseURL: apiBaseURL,
  timeout: 15000,
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('trp.admin_access_token')
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

http.interceptors.response.use(
  (resp: AxiosResponse<ApiEnvelope>) => resp,
  (err) => Promise.reject(err),
)

export function setupHttp() {}

export async function api<T = unknown>(config: AxiosRequestConfig): Promise<T> {
  const resp = await http.request<ApiEnvelope<T>>(config)
  const env = resp.data
  if (env.code !== 0) {
    const err = new Error(env.message ?? 'request failed') as Error & { code?: number; data?: unknown }
    err.code = env.code
    err.data = env.data
    throw err
  }
  return env.data
}
