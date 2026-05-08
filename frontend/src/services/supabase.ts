import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://jorjciajyaqzjuflxefv.supabase.co';

// The anon key is only required for Supabase table/auth operations.
// Edge Functions on this project accept requests without JWT verification,
// so a placeholder works until the real key is added from the Supabase dashboard.
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Convenience: base URL used by the fetch-based API layer for Edge Function calls
export const SUPABASE_FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;
