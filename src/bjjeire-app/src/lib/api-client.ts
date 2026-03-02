import Axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { env } from '@/config/env'

const instance = Axios.create({
  baseURL: env.API_URL,
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.response.use(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  response => response.data,
  (error: AxiosError<unknown>) => {
    if (error.response !== undefined) {
      console.error('API error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      })
    } else if (error.request !== undefined) {
      console.error('No response received:', error.request)
    } else {
      console.error('Error setting up request:', error.message)
    }
    return Promise.reject(error)
  }
)

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.get<T>(url, config) as Promise<T>,
  post: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => instance.post<T>(url, data, config) as Promise<T>,
  put: <T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => instance.put<T>(url, data, config) as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    instance.delete<T>(url, config) as Promise<T>,
}
