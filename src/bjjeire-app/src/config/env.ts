import * as z from 'zod'

const EnvSchema = z.object({
  API_URL: z.string().default('/api'),
  ENABLE_API_MOCKING: z
    .enum(['true', 'false'])
    .transform(val => val === 'true')
    .optional()
    .default('false'),
  APP_URL: z.string().url().optional().default('http://localhost:60743'),
  APP_MOCK_API_PORT: z.string().regex(/^\d+$/).optional().default('443'),
  PAGE_SIZE: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('20'),
  PAGE_NUMBER: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default('1'),
  MSAL_CLIENT_ID: z.string().default(''),
  MSAL_AUTHORITY: z
    .string()
    .default('https://login.microsoftonline.com/common'),
  MSAL_API_SCOPE: z.string().default(''),
  BITCOIN_ADDRESS: z.string().optional().default('not_provided'),
  CONTACT_EMAIL: z.string().email().optional().default('info@bjj-eire.com'),
  SOCIAL_INSTAGRAM_URL: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .default(''),
  SOCIAL_FACEBOOK_URL: z
    .union([z.string().url(), z.literal('')])
    .optional()
    .default(''),
})

export type Env = z.infer<typeof EnvSchema>

const createEnv = (): Env => {
  const viteEnv = import.meta.env
  const relevantEnvVars: Record<string, string | undefined> = {}

  for (const key in viteEnv) {
    if (key.startsWith('VITE_APP_')) {
      relevantEnvVars[key.replace('VITE_APP_', '')] = viteEnv[key] as
        | string
        | undefined
    }
  }

  const parsedEnv = EnvSchema.safeParse(relevantEnvVars)

  if (!parsedEnv.success) {
    console.error(
      '❌ Invalid environment variables:',
      parsedEnv.error.flatten().fieldErrors
    )
    throw new Error(
      `Invalid environment variables provided.\nThe following variables are missing or invalid:\n${Object.entries(
        parsedEnv.error.flatten().fieldErrors
      )
        .map(([k, v]) => `- ${k}: ${v?.join(', ')}`)
        .join('\n')}`
    )
  }

  return parsedEnv.data
}

export const env: Env = createEnv()
