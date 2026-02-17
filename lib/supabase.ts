import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client - creates a new instance per call to avoid module-level env issues
export const createBrowserSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key. Please check your .env.local file.')
  }
  
  return createBrowserClient(url, key)
}

// Server-side Supabase client (for API routes only)
export const createServerSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Anon Key.')
  }
  
  return createClient(url, key)
}

// Admin client with service role (for server-side admin operations only)
export const createAdminSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase URL or Service Role Key.')
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Lazy-loaded legacy exports - only created when first accessed
let _supabase: ReturnType<typeof createServerSupabaseClient> | null = null
let _supabaseAdmin: ReturnType<typeof createAdminSupabaseClient> | null = null

export const supabase = new Proxy({} as ReturnType<typeof createServerSupabaseClient>, {
  get(target, prop) {
    if (!_supabase) {
      _supabase = createServerSupabaseClient()
    }
    return Reflect.get(_supabase, prop)
  }
})

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createAdminSupabaseClient>, {
  get(target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createAdminSupabaseClient()
    }
    return Reflect.get(_supabaseAdmin, prop)
  }
})
