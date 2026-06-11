import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

let _supabase: ReturnType<typeof createClient<Database>> | null = null;

function getClient() {
  if (!_supabase) {
    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      return null;
    }
    _supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        storage: typeof window !== 'undefined' ? localStorage : undefined,
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
  return _supabase;
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createClient<Database>>, {
  get(_, prop) {
    const client = getClient();
    if (!client) {
      if (prop === 'functions') {
        return { invoke: async () => ({ data: null, error: new Error('Supabase not configured') }) };
      }
      return () => ({ data: null, error: new Error('Supabase not configured') });
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  },
});

