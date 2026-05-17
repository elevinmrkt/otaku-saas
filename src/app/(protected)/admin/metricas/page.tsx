import { createClient } from '@/lib/supabase/server'
import { Users, BookOpen, Trophy, TrendingUp, Eye, Star } from 'lucide-react'

export default async function AdminMetricas() {
  const supabase = await createClient()

  const [
    { count: totalMembers },
    { count: activeMembers },
    { count: totalContent },
    { count: totalCompletions },
    { data: topContentRaw },
    { data: topMembers },
    { data: recentXp },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('content_items').select('*', { count: 'exact', head: true }),
    supabase.from('content_progress').select('*', { count: 'exact', head: true }).eq('status', 'concluido'),
    supabase.from('content_progress').select('content_item_id, content_items(title, content_type)').eq('status', 'concluido').limit(200) as any,
    supabase.from('user_xp_summary').select('user_id, total_xp, users(name, nickname)').order('total_xp', { ascending: false }).limit(10),
    supabase.from('gamification_events').select('xp_amount, created_at').order('created_at', { ascending: false }).limit(100),
    supabase.from('users').select('created_at').order('created_at', { ascending: true }),
  ])

  const totalXpAwarded = recentXp?.reduce((s: number, e: any) => s + (e.xp_amount || 0), 0) ?? 0

  const contentCounts: Record<string, number> = {}
  topContentRaw?.forEach((p: any) => {
    const id = p.content_item_id
    contentCounts[id] = (contentCounts[id] || 0) + 1
  })
  const topContentList = Object.entries(contentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const entry = topContentRaw?.find((p: any) => p.content_item_id === id)
      return { id, count, title: entry?.content_items?.title ?? id, type: entry?.content_items?.content_type ?? '' }
    })

  const monthlySignups: Record<string, number> = {}
  allUsers?.forEach((u: any) => {
    const key = new Date(u.created_at).toLocaleString('pt-BR', { month: 'short', year: '2-digit' })
    monthlySignups[key] = (monthlySignups[key] || 0) + 1
  })
  const last6Months = Object.entries(monthlySignups).slice(-6)

  const stats = [
    { label: 'Total de membros', value: totalMembers ?? 0, icon: Users, color: 'var(--red)' },
    { label: 'Membros ativos', value: activeMembers ?? 0, icon: TrendingUp, color: 'var(--green)' },
    { label: 'Conteúdos cadastrados', value: totalContent ?? 0, icon: BookOpen, color: 'var(--gold)' },
    { label: 'Conclusões de conteúdo', value: totalCompletions ?? 0, icon: Trophy, color: '#7c5cbf' },
    { label: 'XP distribuído (últimos 100 eventos)', value: totalXpAwarded.toLocaleString('pt-BR'), icon: Star, color: 'var(--gold)' },
  ]

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="label">Gestão</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Métricas</h1>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.2rem' }}>
            <s.icon size={18} color={s.color} style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Top content */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.03em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Eye size={16} />Conteúdos mais concluídos</h2>
          {topContentList.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topContentList.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--muted)', width: '20px' }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.type}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1rem' }}>{c.count}</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Sem dados ainda.</p>}
        </div>

        {/* Top members by XP */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.03em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Star size={16} />Ranking de XP</h2>
          {topMembers && topMembers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topMembers.map((m: any, i: number) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontFamily: 'var(--font-display)', color: i === 0 ? 'var(--gold)' : i === 1 ? '#aaa' : i === 2 ? '#cd7f32' : 'var(--muted)', width: '20px' }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem' }}>{m.users?.nickname || m.users?.name || 'Membro'}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1rem' }}>{m.total_xp} XP</span>
                </div>
              ))}
            </div>
          ) : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Sem dados ainda.</p>}
        </div>

        {/* Monthly signups */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', gridColumn: '1 / -1' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.03em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><TrendingUp size={16} />Novos membros por mês</h2>
          {last6Months.length > 0 ? (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '100px' }}>
              {last6Months.map(([month, count]) => {
                const maxVal = Math.max(...last6Months.map(([, c]) => c))
                const height = maxVal > 0 ? Math.max(8, (count / maxVal) * 80) : 8
                return (
                  <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--fg)' }}>{count}</span>
                    <div style={{ width: '100%', height: `${height}px`, background: 'var(--red)', borderRadius: '4px 4px 0 0', opacity: 0.85 }} />
                    <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{month}</span>
                  </div>
                )
              })}
            </div>
          ) : <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Sem dados ainda.</p>}
        </div>
      </div>
    </div>
  )
}
