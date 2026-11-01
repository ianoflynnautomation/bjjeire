import * as z from 'zod/mini'
import { logger } from '@/lib/logger'

const optionalUrl = z._default(z.union([z.url(), z.literal('')]), '')
const positiveInt = z.coerce.number().check(z.int(), z.positive())

const EnvSchema = z.object({
  API_URL: z._default(z.string(), ''),
  ENABLE_API_MOCKING: z._default(
    z.pipe(
      z.enum(['true', 'false']),
      z.transform(val => val === 'true')
    ),
    false
  ),
  APP_URL: z._default(z.url(), 'http://localhost:60743'),
  APP_MOCK_API_PORT: z._default(positiveInt, 443),
  PAGE_SIZE: z._default(positiveInt, 20),
  PAGE_NUMBER: z._default(positiveInt, 1),
  MSAL_CLIENT_ID: z._default(z.string(), ''),
  MSAL_AUTHORITY: optionalUrl,
  MSAL_API_SCOPE: z._default(z.string(), ''),
  CONTACT_EMAIL: z._default(z.email(), 'info@bjj-eire.com'),
  SOCIAL_INSTAGRAM_URL: optionalUrl,
  SOCIAL_FACEBOOK_URL: optionalUrl,
  GITHUB_URL: optionalUrl,
  CF_BEACON_TOKEN: z._default(z.string(), ''),
})

export type Env = z.infer<typeof EnvSchema>

const createEnv = (): Env => {
  const viteEnv = import.meta.env
  const relevantEnvVars: Record<string, string | undefined> = {}

  for (const key in viteEnv) {
    if (key.startsWith('VITE_APP_')) {
      const rawValue = viteEnv[key] as string | undefined
      relevantEnvVars[key.replace('VITE_APP_', '')] =
        rawValue === '' ? undefined : rawValue
    }
  }

  const parsedEnv = EnvSchema.safeParse(relevantEnvVars)

  if (!parsedEnv.success) {
    logger.error(
      'Invalid environment variables:',
      z.flattenError(parsedEnv.error).fieldErrors
    )
    throw new Error(
      `Invalid environment variables provided.\nThe following variables are missing or invalid:\n${Object.entries(
        z.flattenError(parsedEnv.error).fieldErrors
      )
        .map(([k, v]) => `- ${k}: ${v.join(', ')}`)
        .join('\n')}`
    )
  }

  return parsedEnv.data
}

export const env: Env = createEnv()
