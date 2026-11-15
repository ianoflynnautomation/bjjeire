import Axios from 'axios'
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { API_BASE_PATH, API_RESOURCE_ROUTES } from '@/config/api-routes'
import { logger } from '@/lib/logger'

/**
 * Reads are public and carry no token, except the organiser's tournament
 * reads, which list drafts and answer 401 without one.
 */
function isAdminRead(url: string | undefined): boolean {
  const path = `/${(url ?? '').replace(/^\/+/u, '')}`
  const admin = API_RESOURCE_ROUTES.tournamentsAdmin
  return (
    path === admin ||
    path.startsWith(`${admin}/`) ||
    path.startsWith(`${admin}?`)
  )
}

/**
 * Routes that act for the signed-in competitor and carry the competitor
 * token, whatever the method (ADR-0012). The organiser token is never sent
 * on them, and the competitor token is never sent anywhere else.
 */
function isCompetitorRoute(url: string | undefined): boolean {
  const path = `/${(url ?? '').replace(/^\/+/u, '')}`.split('?')[0]
  const { competitor, registration, tournaments } = API_RESOURCE_ROUTES
  return (
    [competitor, registration].some(
      prefix => path === prefix || path.startsWith(`${prefix}/`)
    ) ||
    (path.startsWith(`${tournaments}/`) && path.endsWith('/eligible-division'))
  )
}

class ApiService {
  private readonly instance: AxiosInstance

  constructor() {
    this.instance = Axios.create({
      baseURL: `${env.API_URL}${API_BASE_PATH}`,
      headers: { 'Content-Type': 'application/json' },
    })
    this.setupRequestInterceptor()
    this.setupErrorLoggingInterceptor()
  }

  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(async config => {
      const method = (config.method ?? 'get').toLowerCase()

      if (isCompetitorRoute(config.url)) {
        const { getCompetitorToken } = await import('@/lib/competitor-auth')
        const token = await getCompetitorToken()
        if (token !== null) {
          config.headers.set('Authorization', `Bearer ${token}`)
        }
        return config
      }
      if (method === 'get' && !isAdminRead(config.url)) {
        return config
      }
      // Public reads never need a token, so the sign-in code loads only for a write or an admin read.
      const { getAdminToken } = await import('@/lib/admin-auth')
      let token: string | null
      try {
        token = await getAdminToken()
      } catch (error) {
        logger.error(
          'Silent token acquisition failed — blocking unauthenticated write:',
          { url: config.url }
        )
        throw error
      }
      if (token !== null) {
        config.headers.set('Authorization', `Bearer ${token}`)
      }
      return config
    })
  }

  private setupErrorLoggingInterceptor(): void {
    this.instance.interceptors.response.use(undefined, (error: AxiosError) => {
      if (error.response !== undefined) {
        logger.error('API error:', {
          status: error.response.status,
          url: error.config?.url,
          message: error.message,
        })
      } else if (error.request === undefined) {
        logger.error('Error setting up request:', error.message)
      } else {
        logger.error('No response received:', {
          url: error.config?.url,
          message: error.message,
        })
      }
      return Promise.reject(error)
    })
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config)
    return response.data
  }

  async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config)
    return response.data
  }

  async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config)
    return response.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config)
    return response.data
  }
}

export const api = new ApiService()
