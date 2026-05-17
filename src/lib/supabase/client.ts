import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createClient() {
  return createBrowserClient<Database>(
    supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
  )
}
