'use server'

import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { inviteEmailHtml } from '@/lib/email/templates'
import { randomBytes } from 'node:crypto'

const SUPABASE_URL = 'https://mdamossubweuqntwsblp.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYW1vc3N1YndldXFudHdzYmxwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODkyODQ1MCwiZXhwIjoyMDk0NTA0NDUwfQ.QY9HSHQu2Y3wsiQVFWvyDf2Q1n5E7U8aVuBpT2dfVSk'

const admin = createSupabaseAdmin(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!'
  const bytes = randomBytes(14)
  return Array.from(bytes).map(b => chars[b % chars.length]).join('')
}

export async function createMemberAction(formData: FormData): Promise<string | null> {
  const email = (formData.get('email') as string).trim().toLowerCase()
  const name = (formData.get('name') as string).trim()
  const role = (formData.get('role') as string) || 'membro'

  const password = generatePassword()

  // 1. Create auth user with the generated password (email auto-confirmed)
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })
  if (createErr) return createErr.message

  // 2. Update profile with name and role
  await admin.from('users').update({ name, role }).eq('id', created.user.id)

  // 3. Send branded invite email via Resend
  const resendKey = process.env.RESEND_API_KEY
  if (resendKey) {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: 'Otaku Estóico <onboarding@resend.dev>',
      to: email,
      subject: `${name.split(' ')[0]}, seu acesso ao Otaku Estóico está pronto 🎌`,
      html: inviteEmailHtml({ name, email, password }),
    })
  }

  revalidatePath('/admin/membros')
  return null
}
