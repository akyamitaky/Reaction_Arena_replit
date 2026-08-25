import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().trim().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().trim().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: Record<string, string | undefined> = import.meta.env): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('[env] invalid environment configuration:', parsed.error.flatten());
    return {};
  }
  return parsed.data;
}
