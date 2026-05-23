import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, BookOpen, Flame, BookMarked, MessageSquare, Activity } from 'lucide-react'
import SetupBanner from '@/components/admin/SetupBanner'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalMembers },
    { count: newMembers },
    { count: onboardingDone },
    { count: videoDone },
    { count: anamnesisDone },
    { count: publishedContent },
    { data: activeChallenge },
    { data: activeClub },
    { data: recentComments },
    { count: inactiveMembers },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'membro'),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'membro').gte('created_at', sevenDaysAgo),
    supabase.from('users').select('*', { count: 'exact', head: true }).not('onboarding_completed_at', 'is', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).not('welcome_video_completed_at', 'is', null),
    supabase.from('users').select('*', { count: 'exact', head: true }).not('anamnesis_completed_at', 'is', null),
    supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('status', 'publicado'),
    supabase.from('challenges').select('*').in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).maybeSingle(),
    supabase.from('book_club_cycles').select('*').in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).maybeSingle(),
    supabase.from('comments').select('*, users(nickname, name), content_items(title)').order('created_at', { ascending: false }).limit(5) as any,
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'membro').lt('last_login_at', thirtyDaysAgo),
  ])

  const stats = [
    { label: 'Membros ativos', value: totalMembers ?? 0, icon: <Users size={20} />, color: 'var(--red)', href: '/admin/membros' },
    { label: 'Novos (7 dias)', value: newMembers ?? 0, icon: <Activity size={20} />, color: 'var(--gold)', href: '/admin/membros' },
    { label: 'Onboarding concluído', value: onboardingDone ?? 0, icon: <Users size={20} />, color: 'var(--green)', href: '/admin/membros' },
    { label: 'Vídeo concluído', value: videoDone ?? 0, icon: <BookOpen size={20} />, color: 'var(--green)', href: '/admin/membros' },
    { label: 'Anamnese concluída', value: anamnesisDone ?? 0, icon: <Users size={20} />, color: 'var(--green)', href: '/admin/membros' },
    { label: 'Conteúdos publicados', value: publishedContent ?? 0, icon: <BookOpen size={20} />, color: '#7c6fcd', href: '/admin/conteudos' },
    { label: 'Inativo (30+ dias)', value: inactiveMembers ?? 0, icon: <Activity size={20} />, color: '#ff6b6b', href: '/admin/membros' },
  ]

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="label">Visão geral</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
          Dashboard
        </h1>
      </div>

      <SetupBanner />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="card-hover"
            style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '1.25rem',
              textDecoration: 'none', display: 'block',
            }}
          >
            <div style={{ color: s.color, marginBottom: '0.5rem' }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, marginTop: '0.25rem' }}>{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Active items + recent comments */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Active challenge/club */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Flame size={14} color="var(--red)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Desafio mensal</span>
            </div>
            {activeChallenge ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{activeChallenge.title}</strong>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '99px', background: activeChallenge.status === 'ativo' ? 'rgba(37,211,102,0.12)' : 'rgba(200,144,26,0.12)', color: activeChallenge.status === 'ativo' ? 'var(--green)' : 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeChallenge.status}</span>
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{activeChallenge.duration_days} dias</span>
                <Link href="/admin/desafio" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--red)', fontWeight: 700 }}>
                  Gerenciar →
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Nenhum desafio ativo</p>
                <Link href="/admin/desafio" className="btn-primary sm">Criar desafio</Link>
              </div>
            )}
          </div>

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <BookMarked size={14} color="var(--gold)" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clube da leitura</span>
            </div>
            {activeClub ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>{activeClub.work_title}</strong>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '99px', background: activeClub.status === 'ativo' ? 'rgba(37,211,102,0.12)' : 'rgba(200,144,26,0.12)', color: activeClub.status === 'ativo' ? 'var(--green)' : 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{activeClub.status}</span>
                </div>
                {activeClub.total_pages && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Página {activeClub.current_page ?? 0} / {activeClub.total_pages}</span>
                )}
                <Link href="/admin/clube" style={{ display: 'block', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 700 }}>
                  Gerenciar →
                </Link>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Nenhum ciclo ativo</p>
                <Link href="/admin/clube" className="btn-primary sm">Criar ciclo</Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent comments */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <MessageSquare size={14} color="var(--muted)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reflexões recentes</span>
          </div>
          {recentComments && recentComments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentComments.map((c: any) => (
                <div key={c.id} style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <strong style={{ fontSize: '0.8rem' }}>{c.users?.nickname || c.users?.name || 'Membro'}</strong>
                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.content_items?.title}</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                    {c.body.slice(0, 100)}{c.body.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nenhuma reflexão enviada ainda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
