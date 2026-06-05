import { formatLocalDate } from '../../shared/date'
import type { AuthState } from '../../shared/types'
import { getApiBaseUrl } from './config'

export interface ApiHttpOptions {
  getAuthState?: () => Promise<AuthState>
  onUnauthorized?: () => Promise<AuthState | null>
}

export class ApiHttpClient {
  constructor(private readonly options: ApiHttpOptions = {}) {}

  async get<T>(path: string, query?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, undefined, query)
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, unknown>,
    retry = true
  ): Promise<T> {
    const response = await fetch(this.url(path, query), {
      method,
      headers: await this.headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(serializeBody(body)),
    })

    if (response.status === 401 && retry && this.options.onUnauthorized) {
      const nextState = await this.options.onUnauthorized()
      if (nextState?.session) {
        return this.request<T>(method, path, body, query, false)
      }
    }

    if (!response.ok) {
      throw new Error(await readErrorMessage(response))
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  private url(path: string, query?: Record<string, unknown>): string {
    const url = new URL(`${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`)

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value === undefined || value === null || value === '') {
        continue
      }

      url.searchParams.set(key, String(value))
    }

    return url.toString()
  }

  private async headers(hasBody: boolean): Promise<Record<string, string>> {
    const headers: Record<string, string> = {}

    if (hasBody) {
      headers['Content-Type'] = 'application/json'
    }

    const state = await this.options.getAuthState?.()
    if (state?.session?.accessToken) {
      headers.Authorization = `Bearer ${state.session.accessToken}`
    }

    return headers
  }
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: unknown; code?: unknown }
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message
    if (typeof message === 'string' && message.trim()) {
      return message
    }
    if (typeof body.code === 'string' && body.code.trim()) {
      return body.code
    }
  } catch {
    // Ignore invalid/non-JSON error bodies and use the HTTP status fallback.
  }

  return `HTTP ${response.status}`
}

function serializeBody(value: unknown): unknown {
  if (value instanceof Date) {
    return formatLocalDate(value)
  }

  if (Array.isArray(value)) {
    return value.map(serializeBody)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, serializeBody(item)])
    )
  }

  return value
}
