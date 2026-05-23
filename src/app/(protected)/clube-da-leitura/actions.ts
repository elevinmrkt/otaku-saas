'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function joinClubAction(cycleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('user_club_progress').upsert({
    cycle_id: cycleId,
    user_id: user.id,
    current_page: 0,
    status: 'lendo',
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'cycle_id,user_id', ignoreDuplicates: true })

  if (error) return { error: error.message }
  revalidatePath('/clube-da-leitura')
  return { ok: true }
}

export async function updateMyPageAction(cycleId: string, page: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('user_club_progress').upsert({
    cycle_id: cycleId,
    user_id: user.id,
    current_page: page,
    status: 'lendo' as const,
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'cycle_id,user_id' })

  if (error) return { error: error.message }
  revalidatePath('/clube-da-leitura')
  return { ok: true }
}

export async function markConcludedAction(cycleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('user_club_progress').upsert({
    cycle_id: cycleId,
    user_id: user.id,
    current_page: 0,
    status: 'concluido' as const,
    joined_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'cycle_id,user_id' })

  if (error) return { error: error.message }
  revalidatePath('/clube-da-leitura')
  return { ok: true }
}
