import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import NotificationForm from '@/components/admin/NotificationForm'
import DeleteButton from '@/components/admin/DeleteButton'
import { Plus, Bell, Users, User } from 'lucide-react'
import Link from 'next/link'

async function deleteNotificacao(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('notifications').delete().eq('id', id)
  revalidatePath('/admin/notificacoes')
}

async function deleteTodasLidas() {
  'use server'
  const supabase = await createClient()
  await supabase.from('notifications').delete().eq('is_read', true)
  revalidatePath('/admin/notificacoes')
}

export default async function AdminNotificacoes({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string }>
}) {
  const { acao } = await searchParams
  const supabase = await createClient()

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, users(nickname, name)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (acao === 'novo') return <NotificationForm />

  const lidasCount = notifications?.filter((n: any) => n.is_read).length ?? 0

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div><span className="label">Gestão</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Notificações</h1></div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {lidasCount > 0 && (
            <DeleteButton
              action={deleteTodasLidas}
              confirmMsg={`Apagar ${lidasCount} notificação(ões) já lida(s)?`}
            />
          )}
          <Link href="/admin/notificacoes?acao=novo" className="btn-primary"><Plus size={14} />Nova notificação</Link>
        </div>
      </div>

      {notifications && notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map((n: any) => {
            const user = n.users
            return (
              <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem', opacity: n.is_read ? 0.6 : 1 }}>
                <div style={{ marginTop: '2px' }}>
                  {user ? <User size={16} color="var(--muted)" /> : <Users size={16} color="var(--gold)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem' }}>{n.title}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{n.body}</span>
                  <div style={{ marginTop: '0.25rem', display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: 'var(--muted)' }}>
                    <span>{user ? `Para: ${user.nickname || user.name}` : 'Para: todos'}</span>
                    <span>{new Date(n.created_at).toLocaleString('pt-BR')}</span>
                    {n.is_read && <span style={{ color: 'var(--green)' }}>Lida</span>}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--card-2)', padding: '2px 8px', borderRadius: '99px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{n.notification_type}</span>
                <DeleteButton action={deleteNotificacao.bind(null, n.id)} confirmMsg={`Apagar a notificação "${n.title}"?`} />
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Bell size={32} color="var(--muted)" />
          <p>Nenhuma notificação enviada.</p>
          <Link href="/admin/notificacoes?acao=novo" className="btn-primary"><Plus size={14} />Enviar primeira notificação</Link>
        </div>
      )}
    </div>
  )
}
