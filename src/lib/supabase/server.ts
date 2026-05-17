import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

const SUPABASE_URL = 'https://mdamossubweuqntwsblp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5Mjg0NTAsImV4cCI6MjA5NDUwNDQ1MH0.js_2G6--GTLQb72sLjuN2Ypu6nLwUEEGhPc5CVRofVc'

function cookieHandlers(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return {
    getAll() { return cookieStore.getAll() },
    setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options as any))
      } catch {}
    },
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, { cookies: cookieHandlers(cookieStore) })
}

export async function createServiceClient() {
  const cookieStore = await cookies()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyODQ1MCwiZXhwIjoyMDk0NTA0NDUwfQ.QY9HSHQu2Y3wsiQVFWvyDf2Q1n5E7U8aVuBpT2dfVSk'
  return createServerClient<Database>(SUPABASE_URL, serviceKey, { cookies: cookieHandlers(cookieStore) })
}
