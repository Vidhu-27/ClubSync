import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z.string().url().default('mongodb://localhost:27017'),
  MONGODB_DB: z.string().min(1).default('clubsync'),
  JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters long'),
  ALLOW_DB_MOCK: z.enum(['true', 'false']).optional().default('false'),
  // Admin/Director credentials for seeding
  DIRECTOR_EMAIL: z.string().email().default('director@mitwpu.edu.in'),
  DIRECTOR_PASSWORD: z.string().min(8, 'Director password must be at least 8 characters'),
  // Optional overrides
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Parse and validate process.env
// This will throw an error if validation fails, preventing the app from starting with invalid config
const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2))
  // In production, we want to crash hard. In dev, we might want to be more lenient but for security we'll crash too.
  throw new Error('Invalid environment variables')
}

export const env = parsedEnv.data
