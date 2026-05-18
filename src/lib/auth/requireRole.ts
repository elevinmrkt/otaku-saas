'use server'

import { createClient } from '@/lib/supabase/server'

type Role = 'admin' | 'editor' | 'mentor' | 'suporte' | 'membro'

export async function requireRole(allowed: Role[]): Promise<{ userId: string } | never> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Não autenticado')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !allowed.includes(profile.role as Role)) {
    throw new Error('Sem permissão')
  }

  return { userId: user.id }
}
