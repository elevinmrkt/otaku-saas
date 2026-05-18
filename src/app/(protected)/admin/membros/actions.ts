'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/requireRole'

const SUPABASE_URL = 'https://mdamossubweuqntwsblp.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createSupabaseAdmin(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

export async function createMemberAction(formData: FormData): Promise<string | null> {
  try { await requireRole(['admin', 'suporte']) } catch (e: any) { return e.message }

  const email = (formData.get('email') as string ?? '').trim().toLowerCase()
  const name = (formData.get('name') as string ?? '').trim()
  const role = (formData.get('role') as string) || 'membro'

  if (!validateEmail(email)) return 'E-mail inválido.'
  if (!name || name.length < 2 || name.length > 100) return 'Nome inválido (2–100 caracteres).'
  const allowedRoles = ['membro', 'mentor', 'editor', 'suporte', 'admin']
  if (!allowedRoles.includes(role)) return 'Papel inválido.'

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: 'https://otaku-saas.vercel.app/atualizar-senha',
  })
  if (inviteErr) return inviteErr.message

  await admin.from('users').update({ name, role }).eq('id', invited.user.id)

  revalidatePath('/admin/membros')
  return null
}

export async function deleteMemberAction(memberId: string): Promise<string | null> {
  try { await requireRole(['admin']) } catch (e: any) { return e.message }

  if (!memberId || typeof memberId !== 'string' || memberId.length !== 36) {
    return 'ID inválido.'
  }

  await admin.from('content_progress').delete().eq('user_id', memberId)
  await admin.from('comments').delete().eq('user_id', memberId)
  await admin.from('gamification_events').delete().eq('user_id', memberId)
  await admin.from('user_xp_summary').delete().eq('user_id', memberId)
  await admin.from('users').delete().eq('id', memberId)

  const { error } = await admin.auth.admin.deleteUser(memberId)
  if (error) return error.message

  revalidatePath('/admin/membros')
  return null
}

export async function resendInviteAction(email: string): Promise<{ link: string } | string> {
  try { await requireRole(['admin', 'suporte']) } catch (e: any) { return e.message }

  if (!validateEmail(email)) return 'E-mail inválido.'

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (error) return error.message

  // Use token_hash directly — bypasses PKCE entirely, verifyOtp needs no local verifier
  const tokenHash = (data.properties as any).hashed_token
  const link = `https://otaku-saas.vercel.app/atualizar-senha?token_hash=${tokenHash}&type=magiclink`
  return { link }
}
