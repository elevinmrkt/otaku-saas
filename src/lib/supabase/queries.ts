import { cache } from 'react'
import { createClient } from './server'

// Deduplica chamadas dentro do mesmo request — layout + page chamam as mesmas funções
// mas o banco é consultado só uma vez por request graças ao cache() do React

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('*').eq('id', userId).single()
  return data
})

export const getXpSummary = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('user_xp_summary').select('*').eq('user_id', userId).single()
  return data
})
