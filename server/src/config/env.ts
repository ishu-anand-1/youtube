import { z } from 'zod';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ override: true });
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default('postgresql://postgres:Ishu9334277912@localhost:5432/watchtogether?schema=public'),
  REDIS_URL: z.string().optional(),
  FRONTEND_ORIGIN: z.string().default('http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'),
  SESSION_SECRET: z.string().min(16).default('watchtogether_development_session_secret_key_32chars'),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  SYNC_INTERVAL_MS: z.coerce.number().default(3000),
  REQUEST_TTL_SECONDS: z.coerce.number().default(60),
  ROOM_TTL_MINUTES: z.coerce.number().default(1440),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
