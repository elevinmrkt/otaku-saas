'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePasswordAction(password: string): Promise<string | null> {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return error.message
  return null
}
