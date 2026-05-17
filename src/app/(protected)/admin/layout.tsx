import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'editor', 'mentor', 'suporte'].includes(profile.role)) {
    redirect('/home')
  }

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 68px)' }}>
      <AdminSidebar role={profile.role} />
      <main style={{ flex: 1, overflow: 'auto', padding: 'var(--pad)', background: 'var(--bg-2)' }}>
        {children}
      </main>
    </div>
  )
}
