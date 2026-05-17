'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const SUPABASE_URL = 'https://mdamossubweuqntwsblp.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyODQ1MCwiZXhwIjoyMDk0NTA0NDUwfQ.QY9HSHQu2Y3wsiQVFWvyDf2Q1n5E7U8aVuBpT2dfVSk'

const admin = createSupabaseAdmin(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

export async function createMemberAction(formData: FormData): Promise<string | null> {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const name = (formData.get('name') as string).trim()
  const role = (formData.get('role') as string) || 'membro'

  // Send invite email (Supabase creates the user + sends the invite link)
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: 'https://otaku-saas.vercel.app/atualizar-senha',
  })
  if (inviteErr) return inviteErr.message

  // Update profile with name and role
  await admin.from('users').update({ name, role }).eq('id', invited.user.id)

  revalidatePath('/admin/membros')
  return null
}
