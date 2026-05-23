import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getLevelFromXP, LEVELS } from '@/types/database'
import ProfileEditor from '@/components/profile/ProfileEditor'
import { Zap, Shield, Trophy } from 'lucide-react'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: xpSummary },
    { data: badges },
    { data: recentXp },
    { data: completedContent },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('user_xp_summary').select('*').eq('user_id', user.id).single(),
    supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id).order('earned_at', { ascending: false }) as any,
    supabase.from('gamification_events').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    supabase.from('content_progress').select('*, content_items(title, content_type)').eq('user_id', user.id).eq('status', 'concluido').order('completed_at', { ascending: false }).limit(8) as any,
  ])

  const totalXp = xpSummary?.total_xp ?? 0
  const levelInfo = getLevelFromXP(totalXp)
  const nextLevelXp = levelInfo.next?.min_xp ?? totalXp
  const levelProgress = levelInfo.next ? Math.min(((totalXp - levelInfo.current.min_xp) / (nextLevelXp - levelInfo.current.min_xp)) * 100, 100) : 100

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', alignItems: 'start' }}>
          {/* Left */}
          <div>
            {/* Profile header */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '72px', height: '72px', borderRadius: '16px',
                    background: 'var(--red)', flexShrink: 0, overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'white',
                    boxShadow: '0 4px 20px var(--red-glow)',
                  }}
                >
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (profile?.avatar_char || (profile?.nickname || profile?.name || 'R').charAt(0).toUpperCase())}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '0.25rem' }}>
                    {profile?.nickname || profile?.name || 'Recruta'}
                  </h1>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1rem' }}>{user.email}</p>

                  {/* XP bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        background: 'var(--gold-dim)', border: '1px solid rgba(200,144,26,0.3)',
                        borderRadius: '6px', padding: '0.3rem 0.7rem',
                        fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--gold)',
                      }}
                    >
                      Nível {levelInfo.current.level} — {levelInfo.current.name}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>{totalXp} XP</span>
                  </div>

                  {levelInfo.next && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                        <span>Progresso para {levelInfo.next.name}</span>
                        <span>{Math.round(levelProgress)}%</span>
                      </div>
                      <div className="prog-bar">
                        <div className="prog-fill" style={{ width: `${levelProgress}%`, background: 'var(--gold)' }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Badges */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Trophy size={16} color="var(--gold)" />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em' }}>Conquistas</h2>
              </div>
              {badges && badges.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  {badges.map((ub: any) => (
                    <div
                      key={ub.id}
                      title={ub.badges?.description ?? ''}
                      style={{
                        background: 'var(--card-2)', border: '1px solid rgba(200,144,26,0.2)',
                        borderRadius: '8px', padding: '0.6rem 0.9rem',
                        fontSize: '0.8rem', fontWeight: 700, color: 'var(--gold-lt)',
                        cursor: 'default',
                      }}
                    >
                      {ub.badges?.icon_url ? (
                        <img src={ub.badges.icon_url} alt={ub.badges.title} style={{ width: '20px', height: '20px', display: 'inline', marginRight: '0.4rem' }} />
                      ) : '🏅 '}
                      {ub.badges?.title}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Nenhuma conquista ainda. Complete conteúdos para ganhar selos!</p>
              )}
            </div>

            {/* Completed content */}
            {completedContent && completedContent.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em', marginBottom: '1rem' }}>
                  Conteúdos concluídos
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {completedContent.map((cp: any) => (
                    <div key={cp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.75rem', background: 'var(--card-2)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', background: 'var(--card)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                        {cp.content_items?.content_type}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{cp.content_items?.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — edit + XP log */}
          <div>
            <ProfileEditor profile={profile} />

            {recentXp && recentXp.length > 0 && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Zap size={14} color="var(--gold)" />
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.03em' }}>Histórico de XP</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {recentXp.map((ev: any) => (
                    <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--muted)' }}>{ev.event_type.replace(/_/g, ' ')}</span>
                      <span className="xp-badge">+{ev.xp_amount} XP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Levels map */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Shield size={14} color="var(--muted)" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.03em' }}>Níveis da Guilda</h3>
              </div>
              {LEVELS.map(lvl => (
                <div
                  key={lvl.level}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.75rem', borderRadius: '6px',
                    background: lvl.level === levelInfo.current.level ? 'rgba(200,144,26,0.1)' : 'transparent',
                    border: `1px solid ${lvl.level === levelInfo.current.level ? 'rgba(200,144,26,0.3)' : 'transparent'}`,
                    marginBottom: '0.25rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--gold)', minWidth: '1.5rem' }}>{lvl.level}</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: lvl.level === levelInfo.current.level ? 700 : 400, color: lvl.level <= levelInfo.current.level ? 'var(--text)' : 'var(--muted)' }}>
                      {lvl.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{lvl.min_xp} XP</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
