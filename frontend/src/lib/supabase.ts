import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase.g'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type { Database }
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type User = Tables<'users'>
export type ProcessingSession = Tables<'processing_sessions'>
export type FrameResult = Tables<'frame_results'>
export type Subscription = Tables<'subscriptions'>
export type UsageTracking = Tables<'usage_tracking'>
