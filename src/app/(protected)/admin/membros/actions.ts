'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/requireRole'

const SUPABASE_URL = 'https://mdamossubweuqntwsblp.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createSupabaseAdmin(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254
}

function validateUuid(id: string): boolean {
  return typeof id === 'string' && UUID_RE.test(id)
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
  let caller: { userId: string }
  try { caller = await requireRole(['admin']) } catch (e: any) { return e.message }

  if (!validateUuid(memberId)) return 'ID inválido.'
  if (caller.userId === memberId) return 'Não é possível excluir a própria conta.'

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

const ALLOWED_STATUSES = ['ativo', 'inativo', 'bloqueado'] as const
const ALLOWED_ROLES = ['membro', 'mentor', 'editor', 'suporte', 'admin'] as const

export async function updateMemberStatusAction(memberId: string, status: string): Promise<string | null> {
  let caller: { userId: string }
  try { caller = await requireRole(['admin', 'suporte']) } catch (e: any) { return e.message }

  if (!validateUuid(memberId)) return 'ID inválido.'
  if (!(ALLOWED_STATUSES as readonly string[]).includes(status)) return 'Status inválido.'
  if (caller.userId === memberId) return 'Não é possível alterar o próprio status.'

  const { error } = await admin.from('users').update({ status, updated_at: new Date().toISOString() }).eq('id', memberId)
  if (error) return error.message
  revalidatePath('/admin/membros')
  return null
}

export async function updateMemberRoleAction(memberId: string, role: string): Promise<string | null> {
  let caller: { userId: string }
  try { caller = await requireRole(['admin']) } catch (e: any) { return e.message }

  if (!validateUuid(memberId)) return 'ID inválido.'
  if (!(ALLOWED_ROLES as readonly string[]).includes(role)) return 'Papel inválido.'
  if (caller.userId === memberId) return 'Não é possível alterar o próprio papel.'

  const { error } = await admin.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', memberId)
  if (error) return error.message
  revalidatePath('/admin/membros')
  return null
}

export async function resendInviteAction(email: string): Promise<{ link: string } | string> {
  try { await requireRole(['admin', 'suporte']) } catch (e: any) { return e.message }
  if (!validateEmail(email)) return 'E-mail inválido.'
  // Member must initiate recovery from their browser for PKCE to work
  return { link: `https://otaku-saas.vercel.app/recuperar-senha` }
}
