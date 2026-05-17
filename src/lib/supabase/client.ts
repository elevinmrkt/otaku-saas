import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    'https://mdamossubweuqntwsblp.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjg0NTAsImV4cCI6MjA5NDUwNDQ1MH0.js_2G6--GTLQb72sLjuN2Ypu6nLwUEEGhPc5CVRofVc'
  )
}
