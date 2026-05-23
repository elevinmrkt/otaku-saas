import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Bell, BookOpen, Flame, Trophy, Info, Video, Calendar, CheckCheck } from 'lucide-react'
import { markAllAsRead, markOneAsRead } from './actions'

function NotifIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    desafio: { icon: <Flame size={16} />, color: 'var(--red)', bg: 'rgba(229,9,20,0.1)' },
    clube: { icon: <BookOpen size={16} />, color: 'var(--gold)', bg: 'rgba(200,144,26,0.1)' },
    selo: { icon: <Trophy size={16} />, color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
    conteudo: { icon: <Video size={16} />, color: 'var(--muted)', bg: 'var(--card-2)' },
    agenda: { icon: <Calendar size={16} />, color: 'var(--green)', bg: 'rgba(37,211,102,0.1)' },
    sistema: { icon: <Info size={16} />, color: 'var(--muted)', bg: 'var(--card-2)' },
  }
  const style = map[type] ?? map.sistema
  return (
    <div style={{ width: '40px', height: '40px', background: style.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: style.color }}>
      {style.icon}
    </div>
  )
}

export default async function NotificacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '5rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <span className="label">Central de avisos</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '0.04em', lineHeight: 1 }}>
            Notificações
          </h1>
          {unreadCount > 0 && (
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.4rem' }}>
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead}>
            <button
              type="submit"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.5rem 1rem', fontSize: '0.8rem', color: 'var(--muted)', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              <CheckCheck size={14} />
              Marcar todas como lidas
            </button>
          </form>
        )}
      </div>

      {/* Lista */}
      {notifications && notifications.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {notifications.map((notif: any) => (
            <form key={notif.id} action={markOneAsRead.bind(null, notif.id)}>
              <button
                type="submit"
                style={{
                  width: '100%', display: 'flex', alignItems: 'flex-start', gap: '1rem',
                  background: notif.is_read ? 'var(--card)' : 'rgba(229,9,20,0.04)',
                  border: `1px solid ${notif.is_read ? 'var(--border)' : 'rgba(229,9,20,0.15)'}`,
                  borderRadius: 'var(--r)', padding: '1rem 1.25rem',
                  cursor: 'pointer', textAlign: 'left', transition: 'border-color 150ms',
                }}
              >
                <NotifIcon type={notif.notification_type ?? 'sistema'} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text)', display: 'block' }}>{notif.title}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {new Date(notif.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {notif.body && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.5 }}>{notif.body}</p>
                  )}
                </div>
                {!notif.is_read && (
                  <div style={{ width: '8px', height: '8px', background: 'var(--red)', borderRadius: '50%', flexShrink: 0, marginTop: '6px' }} />
                )}
              </button>
            </form>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Bell size={48} color="var(--muted)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Tudo em dia</h3>
          <p style={{ color: 'var(--muted)' }}>Nenhuma notificação recente. Quando houver novidades, você verá aqui.</p>
        </div>
      )}
    </div>
  )
}
