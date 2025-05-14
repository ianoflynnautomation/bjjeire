
import * as z from 'zod';

const createEnv = () => {
  const EnvSchema = z.object({
    API_URL: z.string().default('/api'),
    ENABLE_API_MOCKING: z
      .string()
      .refine((s) => s === 'true' || s === 'false')
      .transform((s) => s === 'true')
      .optional()
      .default('false'),
    APP_URL: z.string().optional().default('https://localhost:60743'),
    APP_MOCK_API_PORT: z.string().optional().default('443'),
    PAGE_SIZE: z.string().transform((s) => parseInt(s)).optional().default('12'),
  });

  const envVars = Object.entries(import.meta.env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (key.startsWith('VITE_APP_')) {
        acc[key.replace('VITE_APP_', '')] = value;
      }
      return acc;
    },
    {}
  );

  const parsedEnv = EnvSchema.safeParse(envVars);

  if (!parsedEnv.success) {
    throw new Error(
      `Invalid env provided.\nThe following variables are missing or invalid:\n${Object.entries(
        parsedEnv.error.flatten().fieldErrors
      )
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')}`
    );
  }

  return parsedEnv.data;
};

export const env = createEnv();
