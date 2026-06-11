import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/nav/Navbar'
import { getAuthUser, getProfile, getXpSummary } from '@/lib/supabase/queries'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  const [profile, xpSummary, { count: unreadCount }] = await Promise.all([
    getProfile(user.id),
    getXpSummary(user.id),
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
