import Axios from 'axios'
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { API_BASE_PATH } from '@/config/api-routes'
import { msalInstance, loginRequest } from '@/lib/msal-config'
import { logger } from '@/lib/logger'

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
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length === 0) {
        return config
      }
      const account = accounts[0]
      try {
        const result = await msalInstance.acquireTokenSilent({
          ...loginRequest,
          account,
        })
        config.headers.set('Authorization', `Bearer ${result.accessToken}`)
      } catch (error) {
        // GETs are public reads and may proceed anonymously; writes are
        // protected and must never be sent unauthenticated
        if ((config.method ?? 'get').toLowerCase() !== 'get') {
          logger.error(
            'Silent token acquisition failed — blocking unauthenticated write:',
            { url: config.url }
          )
          throw error
        }
        logger.warn(
          'Silent token acquisition failed — proceeding without auth:',
          error
        )
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
