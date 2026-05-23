'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
  revalidatePath('/notificacoes')
}

export async function markOneAsRead(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', user.id)
  revalidatePath('/notificacoes')
}
