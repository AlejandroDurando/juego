import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'public-anon-key';

// Initialize the Supabase client
export const supabase = createClient<any>(supabaseUrl, supabaseKey);

// Every device plays under an anonymous Supabase session; RLS policies
// key off auth.uid(), so make sure one exists before touching the API.
export async function ensureSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}
