'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const admin = createSupabaseAdmin(
  'https://mdamossubweuqntwsblp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyODQ1MCwiZXhwIjoyMDk0NTA0NDUwfQ.QY9HSHQu2Y3wsiQVFWvyDf2Q1n5E7U8aVuBpT2dfVSk',
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function createMemberAction(formData: FormData): Promise<string | null> {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const name = (formData.get('name') as string).trim()
  const role = (formData.get('role') as string) || 'membro'

  // 1. Create auth user (email auto-confirmed)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { name },
  })
  if (createErr) return createErr.message

  // 2. Update profile with name and role (trigger already created the row)
  await admin.from('users').update({ name, role }).eq('id', created.user.id)

  // 3. Send password-setup email so the member can define their own password
  await admin.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://otaku-saas.vercel.app/atualizar-senha',
  })

  revalidatePath('/admin/membros')
  return null
}
