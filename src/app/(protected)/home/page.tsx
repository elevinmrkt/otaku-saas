import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuthUser, getProfile, getXpSummary } from '@/lib/supabase/queries'
import Link from 'next/link'
import { getLevelFromXP } from '@/types/database'
import HeroSlideshow from '@/components/home/HeroSlideshow'
import CCCCarousel from '@/components/home/CCCCarousel'
import ContentShelf from '@/components/home/ContentShelf'
import TrailsCarousel from '@/components/home/TrailsCarousel'
import { BookOpen, Flame, Users, Calendar } from 'lucide-react'

export default async function HomePage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  const [
    profile,
    xpSummary,
    { data: featuredContent },
    { data: inProgress },
    { data: recentContent },
    { data: trails },
    { data: challengeRows },
    { data: clubRows },
    { data: groups },
    { data: upcomingEvents },
  ] = await Promise.all([
    getProfile(user.id),
    getXpSummary(user.id),
    supabase.from('content_items')
      .select('id, title, slug, content_type, thumbnail_url, poster_url, description, xp_reward, is_new')
      .eq('status', 'publicado').eq('is_featured', true).limit(5) as any,
    supabase.from('content_progress')
      .select('id, progress_percent, content_items(id, title, slug, content_type, thumbnail_url, description)')
      .eq('user_id', user.id).eq('status', 'em_andamento').order('updated_at', { ascending: false }).limit(6) as any,
    supabase.from('content_items')
      .select('id, title, slug, content_type, thumbnail_url, description, is_new, published_at')
      .eq('status', 'publicado').order('published_at', { ascending: false }).limit(12) as any,
    supabase.from('trails')
      .select('id, title, slug, description, thumbnail_url, order_index')
      .eq('status', 'publicado').order('order_index').limit(8),
    supabase.from('challenges')
      .select('id, title, description, poster_url, duration_days, start_date, status')
      .in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).limit(1) as any,
    supabase.from('book_club_cycles')
      .select('id, theme, work_title, work_author, summary, total_pages, current_page, meeting_date, mockup_url, cover_url')
      .in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).limit(1) as any,
    supabase.from('community_groups')
      .select('id, title, description, group_type, whatsapp_url, telegram_url, poster_url')
      .eq('status', 'ativo').order('created_at').limit(3),
    supabase.from('events')
      .select('id, title, start_datetime, meeting_url')
      .eq('status', 'agendado').order('start_datetime').limit(3),
  ])

  const activeChallenge: any = (challengeRows as any[])?.[0] ?? null
  const activeClub: any = (clubRows as any[])?.[0] ?? null

  // Trail progress
  const trailProgressMap: Record<string, number> = {}
  if (trails && user) {
    const trailIds = trails.map(t => t.id)
    const { data: moduleContents } = await supabase
      .from('trail_module_contents')
      .select('content_item_id, trail_modules(trail_id)')
      .in('trail_modules.trail_id', trailIds) as any
    if (moduleContents) {
      const contentIds = (moduleContents as any[]).map((mc: any) => mc.content_item_id)
      const { data: progresses } = await supabase
        .from('content_progress').select('content_item_id, status')
        .eq('user_id', user.id).in('content_item_id', contentIds)
      trails.forEach(trail => {
        const tcIds = (moduleContents as any[]).filter((mc: any) => mc.trail_modules?.trail_id === trail.id).map((mc: any) => mc.content_item_id)
        const done = progresses?.filter(p => tcIds.includes(p.content_item_id) && p.status === 'concluido').length ?? 0
        trailProgressMap[trail.id] = tcIds.length > 0 ? Math.round((done / tcIds.length) * 100) : 0
      })
    }
  }

  const displayName = profile?.nickname || profile?.name || 'Recruta'
  const levelInfo = getLevelFromXP(xpSummary?.total_xp ?? 0)
  const totalXp = xpSummary?.total_xp ?? 0
  const nextLevelXp = levelInfo.next?.min_xp ?? totalXp
  const levelProgress = levelInfo.next
    ? Math.min(((totalXp - levelInfo.current.min_xp) / (nextLevelXp - levelInfo.current.min_xp)) * 100, 100)
    : 100

  // Challenge tasks (fetched separately to avoid FK dependency)
  let challengeTasks: any[] = []
  if (activeChallenge) {
    const { data: tasks } = await supabase
      .from('challenge_tasks')
      .select('id, title, description, xp_reward, day_number')
      .eq('challenge_id', (activeChallenge as any).id)
      .order('day_number')
    challengeTasks = tasks ?? []
  }

  // Challenge day calculation
  const totalDays = activeChallenge?.duration_days ?? 7
  const startDate = activeChallenge?.start_date ? new Date(activeChallenge.start_date) : null
  const currentDay = startDate
    ? Math.max(1, Math.min(Math.floor((Date.now() - startDate.getTime()) / 86400000) + 1, totalDays))
    : 1
  const ringCircumference = 326.73
  const ringOffset = ringCircumference * (1 - currentDay / totalDays)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* ── Hero Welcome (sempre visível) ── */}
      <section className="hero-welcome" id="inicio">
        <div className="hero-bg">
          <img src="/hero-bg.jpg" alt="Protagonista hero" />
        </div>
        <div className="hero-letterbox bottom" aria-hidden="true" />
        <div className="hero-body">
          <div className="hero-left">
            <p className="hero-eyebrow">Bem-vindo ao ecossistema</p>
            <h1 className="hero-title">Protagonista</h1>
            <p className="hero-sub">Sua jornada de trilhas, comunidade e desafios está liberada.</p>
            <div className="hero-actions">
              <Link href="#destaques" className="btn-primary">
                <Flame size={15} />
                Explorar conteúdo
              </Link>
              <Link href="/trilhas" className="btn-ghost">Ver trilhas</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Destaques Hero Slideshow ── */}
      {featuredContent && featuredContent.length > 0 && (
        <HeroSlideshow items={featuredContent} />
      )}

      {/* ── XP bar strip (below hero, always visible) ── */}
      <div style={{
        padding: '1.25rem var(--pad)',
        background: 'var(--bg-2)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1, minWidth: '2rem', textAlign: 'center' }}>
            {levelInfo.current.level}
          </div>
          <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--gold)', fontWeight: 700, marginBottom: '0.3rem' }}>
              {levelInfo.current.name} · {totalXp} XP
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '160px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${levelProgress}%`, background: 'var(--gold)', borderRadius: '99px' }} />
              </div>
              {levelInfo.next && (
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                  {nextLevelXp - totalXp} XP para {levelInfo.next.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <Link href="/trilhas" className="btn-primary sm">
            <Flame size={13} />
            Trilhas
          </Link>
          <Link href="/perfil" className="btn-ghost sm">Perfil</Link>
        </div>
      </div>

      {/* ── Continue Estudando (CCC Carousel) ── */}
      {inProgress && inProgress.length > 0 && (
        <CCCCarousel items={inProgress} />
      )}

      {/* ── Trilhas ── */}
      {trails && trails.length > 0 && (
        <TrailsCarousel trails={trails} progressMap={trailProgressMap} />
      )}

      {/* ── Novidades ── */}
      {recentContent && recentContent.length > 0 && (
        <section className="content-section">
          <div className="section-head inline">
            <div>
              <span className="label">Publicados recentemente</span>
              <h2>Novidades da semana</h2>
            </div>
          </div>
          <ContentShelf items={recentContent} type="content" />
        </section>
      )}

      {/* ── Clube da Leitura ── */}
      <section className="content-section" id="clube">
        <div className="section-head inline">
          <div>
            <span className="label">Ciclo atual</span>
            <h2>Clube da Leitura</h2>
          </div>
          <Link href="/clube-da-leitura" style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>Acessar clube →</Link>
        </div>
        {activeClub ? (
          <div style={{ display: 'grid', gridTemplateColumns: (activeClub as any).mockup_url || (activeClub as any).cover_url ? '1fr auto' : '1fr', gap: '2rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '2rem', alignItems: 'center' }}>
            <div>
              <span className="label">{(activeClub as any).theme ?? 'Obra do mês'}</span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '0.4rem', color: 'var(--text)' }}>
                {(activeClub as any).work_title}
              </h3>
              {(activeClub as any).work_author && (
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1rem' }}>por {(activeClub as any).work_author}</p>
              )}
              {(activeClub as any).summary && (
                <p style={{ fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.6, marginBottom: '1.25rem', maxWidth: '520px', opacity: 0.8 }}>
                  {(activeClub as any).summary.length > 200 ? (activeClub as any).summary.slice(0, 200) + '...' : (activeClub as any).summary}
                </p>
              )}
              {(activeClub as any).total_pages && (
                <div style={{ marginBottom: '1.25rem', maxWidth: '320px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '0.35rem' }}>
                    <span>Leitura coletiva — pág. {(activeClub as any).current_page ?? 0}/{(activeClub as any).total_pages}</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>
                      {Math.round(((activeClub as any).current_page ?? 0) / (activeClub as any).total_pages * 100)}%
                    </span>
                  </div>
                  <div className="prog-bar">
                    <div className="prog-fill" style={{ width: `${Math.round(((activeClub as any).current_page ?? 0) / (activeClub as any).total_pages * 100)}%`, background: 'var(--gold)' }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href="/clube-da-leitura" className="btn-primary">
                  <BookOpen size={14} />
                  Acessar Clube da Leitura
                </Link>
                {(activeClub as any).meeting_date && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={12} />
                    Encontro: {new Date((activeClub as any).meeting_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                  </span>
                )}
              </div>
            </div>
            {((activeClub as any).mockup_url || (activeClub as any).cover_url) && (
              <Link href="/clube-da-leitura" style={{ flexShrink: 0 }}>
                <img
                  src={(activeClub as any).mockup_url ?? (activeClub as any).cover_url}
                  alt={(activeClub as any).work_title}
                  style={{ width: '160px', borderRadius: '8px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', display: 'block' }}
                />
              </Link>
            )}
          </div>
        ) : (
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
            <BookOpen size={32} color="var(--muted)" />
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Nenhum ciclo ativo no momento. A próxima obra será anunciada em breve.</p>
          </div>
        )}
      </section>

      {/* ── Desafio Mensal ── */}
      {activeChallenge ? (
        <section className="challenge-section" id="desafio">
          {activeChallenge.poster_url && (
            <div className="challenge-bg">
              <img src={activeChallenge.poster_url} alt="" />
            </div>
          )}
          <div className="challenge-inner">
            <div className="challenge-content">
              <span className="label">Protocolo mensal</span>
              <h2 className="challenge-title">{activeChallenge.title}</h2>
              {activeChallenge.description && (
                <p className="challenge-desc">{activeChallenge.description}</p>
              )}
              <div className="challenge-ring-stats">
                <div className="challenge-ring">
                  <svg className="ring-svg" viewBox="0 0 120 120" width="120" height="120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle
                      cx="60" cy="60" r="52" fill="none" stroke="var(--gold)" strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 60 60)"
                    />
                  </svg>
                  <div className="ring-center">
                    <strong>Dia {currentDay}</strong>
                    <span>de {totalDays}</span>
                  </div>
                </div>
                <div className="challenge-xp-row">
                  <span className="xp-level-badge">{levelInfo.current.name}</span>
                  <div className="xp-progress">
                    <div className="xp-bar-head">
                      <span>{totalXp} XP</span>
                      {levelInfo.next && <span>Próximo: {nextLevelXp}</span>}
                    </div>
                    <div className="xp-bar">
                      <div className="xp-fill" style={{ width: `${levelProgress}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="challenge-actions">
                <Link href="/desafio-mensal" className="btn-primary">
                  <Flame size={15} />
                  Participar do desafio
                </Link>
                <Link href="/desafio-mensal" className="btn-ghost">Ver histórico</Link>
              </div>
            </div>

            <div className="challenge-missions">
              <span className="label">Missões do desafio</span>
              {challengeTasks.length > 0
                ? (challengeTasks as any[]).sort((a: any, b: any) => (a.day_number ?? 0) - (b.day_number ?? 0)).slice(0, 5).map((task: any, i: number) => (
                    <div key={task.id} className="mission-item">
                      <span className="mission-num">{String(i + 1).padStart(2, '0')}</span>
                      <div className="mission-body">
                        <strong>{task.title}</strong>
                        {task.description && <p>{task.description}</p>}
                      </div>
                      {task.xp_reward > 0 && <span className="mission-xp">+{task.xp_reward} XP</span>}
                    </div>
                  ))
                : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '1rem 0' }}>
                      As missões do desafio serão adicionadas em breve.
                    </p>
                  )
              }
            </div>
          </div>
        </section>
      ) : (
        <section className="content-section" id="desafio">
          <div className="section-head">
            <span className="label">Protocolo mensal</span>
            <h2>Desafio Mensal</h2>
          </div>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', textAlign: 'center' }}>
            <Flame size={32} color="var(--muted)" />
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Nenhuma missão ativa agora. O próximo desafio será liberado pela equipe.</p>
            <Link href="/desafio-mensal" className="btn-ghost sm" style={{ marginTop: '0.25rem' }}>Ver histórico</Link>
          </div>
        </section>
      )}

      {/* ── Comunidade ── */}
      {groups && groups.length > 0 && (
        <section className="content-section" id="comunidade">
          <div className="section-head">
            <span className="label">Espaços de interação</span>
            <h2>Comunidade</h2>
          </div>
          <div className="community-cards">
            {(groups as any[]).map((g: any, i: number) => (
              <a
                key={g.id}
                href={g.whatsapp_url || g.telegram_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="comm-card"
              >
                <div className="comm-card-bg" style={{
                  background: `linear-gradient(135deg, hsl(${i * 120 + 150},50%,10%) 0%, #0a0a0a 100%)`,
                }}>
                  {g.poster_url && <img src={g.poster_url} alt={g.title} />}
                </div>
                <div className="comm-card-body">
                  <div className="comm-card-top">
                    <div className={`comm-icon${i === 2 ? ' notif' : ''}`}>
                      <Users size={20} />
                    </div>
                    <span className="comm-badge">{g.group_type === 'whatsapp' ? 'WhatsApp' : g.group_type ?? 'Grupo'}</span>
                  </div>
                  <div className="comm-card-bottom">
                    <h3>{g.title}</h3>
                    {g.description && <p>{g.description.slice(0, 80)}{g.description.length > 80 ? '...' : ''}</p>}
                    <span className="btn-primary sm" style={{ marginTop: '0.5rem', alignSelf: 'flex-start' }}>
                      Entrar no grupo →
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── Agenda ── */}
      {upcomingEvents && upcomingEvents.length > 0 && (
        <section className="content-section">
          <div className="section-head">
            <span className="label">Próximos eventos</span>
            <h2>Agenda</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(upcomingEvents as any[]).map((ev: any) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '1rem 1.25rem',
                }}
              >
                <div style={{
                  minWidth: '48px', height: '48px',
                  background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)',
                  borderRadius: '8px', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={18} color="var(--red)" />
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)' }}>{ev.title}</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {new Date(ev.start_datetime).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {ev.meeting_url && (
                  <a href={ev.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-ghost sm">Entrar</a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div style={{ width: '34px', height: '34px', borderRadius: '4px', background: 'var(--red)', display: 'grid', placeItems: 'center', fontSize: '0.72rem', fontWeight: 900, letterSpacing: '0.04em', flexShrink: 0 }}>OE</div>
            <p>Otaku Estóico — Ecossistema Protagonista</p>
          </div>
          <nav className="footer-nav">
            <Link href="/trilhas">Trilhas</Link>
            <Link href="/biblioteca">Biblioteca</Link>
            {activeChallenge && <Link href="/desafio-mensal">Desafio</Link>}
            <Link href="/comunidade">Comunidade</Link>
          </nav>
          <p className="footer-copy">© 2026 Otaku Estóico. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  )
}
