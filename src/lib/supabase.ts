import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side helper for Supabase (if client-side env vars VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isClientSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isClientSupabaseEnabled
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
