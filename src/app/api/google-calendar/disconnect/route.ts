import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return Response.json({ ok: false }, { status: 401 })

  await supabase.auth.updateUser({ data: { google_calendar: null } })

  return Response.json({ ok: true })
}
