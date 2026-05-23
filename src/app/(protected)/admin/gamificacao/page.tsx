import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { LEVELS } from '@/types/database'
import BadgeForm from '@/components/admin/BadgeForm'
import DeleteButton from '@/components/admin/DeleteButton'
import { Plus, Edit, Star, Zap } from 'lucide-react'
import Link from 'next/link'

async function deleteBadge(id: string) {
  'use server'
  const supabase = await createClient()
  await supabase.from('user_badges').delete().eq('badge_id', id)
  await supabase.from('badges').delete().eq('id', id)
  revalidatePath('/admin/gamificacao')
}

export default async function AdminGamificacao({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string; tab?: string }>
}) {
  const { acao, id, tab = 'badges' } = await searchParams
  const supabase = await createClient()

  const [{ data: badges }, { data: recentEvents }] = await Promise.all([
    supabase.from('badges').select('*').order('created_at', { ascending: true }),
    supabase.from('gamification_events').select('event_type, xp_amount').order('created_at', { ascending: false }).limit(200),
  ])

  let editBadge = null
  if (acao === 'editar' && id) {
    const { data } = await supabase.from('badges').select('*').eq('id', id).single()
    editBadge = data
  }
  if (acao === 'novo-badge' || editBadge) return <BadgeForm badge={editBadge} />

  const xpByType: Record<string, { count: number; total: number }> = {}
  recentEvents?.forEach((e: any) => {
    if (!xpByType[e.event_type]) xpByType[e.event_type] = { count: 0, total: 0 }
    xpByType[e.event_type].count++
    xpByType[e.event_type].total += e.xp_amount
  })
  const xpEntries = Object.entries(xpByType).sort((a, b) => b[1].total - a[1].total)

  return (
    <div style={{ maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div><span className="label">Gestão</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>Gamificação</h1></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {[{ key: 'badges', label: 'Conquistas' }, { key: 'niveis', label: 'Níveis' }, { key: 'xp', label: 'Eventos de XP' }].map(t => (
          <Link key={t.key} href={`/admin/gamificacao?tab=${t.key}`} style={{
            padding: '0.5rem 1.2rem', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none',
            color: tab === t.key ? 'var(--fg)' : 'var(--muted)',
            borderBottom: tab === t.key ? '2px solid var(--red)' : '2px solid transparent',
            marginBottom: '-1px',
          }}>{t.label}</Link>
        ))}
      </div>

      {tab === 'badges' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <Link href="/admin/gamificacao?acao=novo-badge" className="btn-primary"><Plus size={14} />Nova conquista</Link>
          </div>
          {badges && badges.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
              {badges.map((b: any) => (
                <div key={b.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '2rem', minWidth: '40px', textAlign: 'center' }}>{b.icon_url && !b.icon_url.startsWith('http') ? b.icon_url : '🏅'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: '0.85rem', display: 'block' }}>{b.title}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{b.description}</span>
                    {b.xp_reward > 0 && <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--gold)', marginTop: '0.25rem' }}>+{b.xp_reward} XP</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
                    <Link href={`/admin/gamificacao?acao=editar&id=${b.id}`} className="btn-ghost sm"><Edit size={12} /></Link>
                    <DeleteButton action={deleteBadge.bind(null, b.id)} confirmMsg={`Apagar a conquista "${b.title}"? O registro de membros que a possuem também será apagado.`} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>Nenhuma conquista cadastrada.</p></div>
          )}
        </div>
      )}

      {tab === 'niveis' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Níveis definidos em <code>src/types/database.ts</code> — edite o array <code>LEVELS</code> para alterar.</p>
          {LEVELS.map((lvl, i) => (
            <div key={lvl.level} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--gold)' }}>{lvl.level}</div>
              <div style={{ flex: 1 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem' }}>{lvl.name}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {lvl.min_xp} XP{i < LEVELS.length - 1 ? ` – ${LEVELS[i + 1].min_xp - 1} XP` : '+'}
                </span>
              </div>
              <Star size={14} color={i === LEVELS.length - 1 ? 'var(--gold)' : 'var(--muted)'} />
            </div>
          ))}
        </div>
      )}

      {tab === 'xp' && (
        <div>
          {xpEntries.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>Baseado nos últimos 200 eventos de XP registrados.</p>
              {xpEntries.map(([type, stats]) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '0.9rem 1.1rem' }}>
                  <Zap size={14} color="var(--gold)" />
                  <div style={{ flex: 1 }}>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>{type}</strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{stats.count} ocorrências</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--gold)' }}>{stats.total} XP</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>Nenhum evento de XP registrado ainda.</p></div>
          )}
        </div>
      )}
    </div>
  )
}
