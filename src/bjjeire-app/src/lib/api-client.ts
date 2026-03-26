import Axios from 'axios'
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'
import { msalInstance, loginRequest } from '@/lib/msal-config'
import { logger } from '@/lib/logger'

class ApiService {
  private readonly instance: AxiosInstance

  constructor() {
    this.instance = Axios.create({
      baseURL: env.API_URL,
      headers: { 'Content-Type': 'application/json' },
    })
    this.setupRequestInterceptor()
    this.setupResponseInterceptor()
  }

  private setupRequestInterceptor(): void {
    this.instance.interceptors.request.use(async config => {
      const account = msalInstance.getAllAccounts()[0]
      if (account !== undefined) {
        try {
          const result = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account,
          })
          config.headers.set('Authorization', `Bearer ${result.accessToken}`)
        } catch (error) {
          logger.warn(
            'Silent token acquisition failed — proceeding without auth:',
            error
          )
        }
      }
      return config
    })
  }

  private setupResponseInterceptor(): void {
    this.instance.interceptors.response.use(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      response => response.data,
      (error: AxiosError<unknown>) => {
        if (error.response !== undefined) {
          logger.error('API error:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers,
          })
        } else if (error.request === undefined) {
          logger.error('Error setting up request:', error.message)
        } else {
          logger.error('No response received:', error.request)
        }
        return Promise.reject(error)
      }
    )
  }

  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get<T>(url, config) as Promise<T>
  }

  post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> {
    return this.instance.post<T>(url, data, config) as Promise<T>
  }

  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.put<T>(url, data, config) as Promise<T>
  }

  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete<T>(url, config) as Promise<T>
  }
}

export const api = new ApiService()
