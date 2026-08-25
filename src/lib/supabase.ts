import { createClient } from '@supabase/supabase-js';
import { loadEnv } from '@/lib/env';

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Multiplayer is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the environment.',
    );
  }
  return supabase;
}
