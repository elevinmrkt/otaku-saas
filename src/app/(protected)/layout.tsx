import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/nav/Navbar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: xpSummary }, { count: unreadCount }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('user_xp_summary').select('*').eq('user_id', user.id).single(),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
  ])

  return (
    <>
      <Navbar
        profile={profile}
        xpSummary={xpSummary}
        unreadCount={unreadCount ?? 0}
      />
      <div style={{ paddingTop: '68px' }}>
        {children}
      </div>
    </>
  )
}
