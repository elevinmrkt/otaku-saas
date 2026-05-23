import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpen, Users, Calendar, Video, ChevronRight, FileText,
  Headphones, Film, ExternalLink, CheckCircle, Clock, Star,
  MessageCircle, Target, PlayCircle,
} from 'lucide-react'
import ProgressWidget from '@/components/clube/ProgressWidget'

function materialIcon(type: string) {
  switch (type) {
    case 'video': return <Video size={14} />
    case 'audio': case 'podcast': return <Headphones size={14} />
    case 'gravacao': return <Film size={14} />
    case 'pagina': return <BookOpen size={14} />
    case 'externo': return <ExternalLink size={14} />
    default: return <FileText size={14} />
  }
}

function materialTypeLabel(type: string) {
  const map: Record<string, string> = {
    pdf: 'PDF', video: 'Vídeo', audio: 'Áudio', podcast: 'Podcast',
    pagina: 'Artigo', gravacao: 'Gravação', externo: 'Link',
  }
  return map[type] ?? type
}

const WHATSAPP_RULES = [
  { emoji: '📖', rule: 'Respeite o ritmo da leitura', detail: 'Não revele páginas além da meta semanal — evite spoilers.' },
  { emoji: '🎯', rule: 'Mantenha o foco na obra', detail: 'Discussões devem girar em torno do livro e do tema do ciclo.' },
  { emoji: '🤝', rule: 'Respeito acima de tudo', detail: 'Opiniões divergem — critique ideias, não pessoas.' },
  { emoji: '🔕', rule: 'Sem mensagens aleatórias', detail: 'Figurinhas, correntes e assuntos off-topic no privado, por favor.' },
]

export default async function ClubeDaLeituraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clubRows } = await supabase
    .from('book_club_cycles')
    .select('*')
    .in('status', ['ativo', 'previsto'])
    .order('created_at', { ascending: false })
    .limit(1) as any

  const activeClub: any = (clubRows as any[])?.[0] ?? null

  const [{ data: pastCycles }, weeklyGoalsRes, materialsRes, myProgressRes] = await Promise.all([
    supabase.from('book_club_cycles').select('*').eq('status', 'encerrado').order('created_at', { ascending: false }).limit(6),
    activeClub ? supabase.from('club_weekly_goals').select('*').eq('cycle_id', activeClub.id).order('week_number') : Promise.resolve({ data: [] }),
    activeClub ? supabase.from('club_cycle_materials').select('*').eq('cycle_id', activeClub.id).order('order_index') : Promise.resolve({ data: [] }),
    activeClub ? supabase.from('user_club_progress').select('*').eq('cycle_id', activeClub.id).eq('user_id', user.id).limit(1) : Promise.resolve({ data: [] }),
  ])

  const weeklyGoals: any[] = weeklyGoalsRes.data ?? []
  const materials: any[] = materialsRes.data ?? []
  const myProgress: any = (myProgressRes.data as any[])?.[0] ?? null

  const hasJoined = !!myProgress
  const isConcluded = myProgress?.status === 'concluido'

  const progressPct = activeClub?.total_pages
    ? Math.round(((activeClub.current_page ?? 0) / activeClub.total_pages) * 100)
    : 0

  const myProgressPct = (activeClub?.total_pages && myProgress?.current_page != null)
    ? Math.round((myProgress.current_page / activeClub.total_pages) * 100)
    : 0

  const now = new Date()
  const meetingDate = activeClub?.meeting_date ? new Date(activeClub.meeting_date) : null
  const isMeetingToday = meetingDate
    ? meetingDate.toDateString() === now.toDateString()
    : false
  const meetingPast = meetingDate ? meetingDate < now : false
  const hasRecording = !!(activeClub?.meeting_recording_url)

  const currentWeek = activeClub?.current_week ?? 1
  const currentGoal = weeklyGoals.find(g => g.week_number === currentWeek)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>

      {activeClub ? (
        <>
          {/* Hero */}
          <div style={{ position: 'relative', minHeight: '400px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
            {(activeClub.banner_url || activeClub.mockup_url || activeClub.cover_url) && (
              <div style={{ position: 'absolute', inset: 0 }}>
                <img
                  src={activeClub.banner_url ?? activeClub.mockup_url ?? activeClub.cover_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'blur(2px) brightness(0.22)' }}
                />
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,10,0.55) 60%, transparent 100%)' }} />
            <div style={{ position: 'relative', padding: 'var(--pad)', paddingBottom: '3rem', maxWidth: '900px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }}>
              <div>
                <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>
                  Clube da Leitura — {activeClub.status === 'previsto' ? 'Em breve' : isMeetingToday ? 'Encontro hoje!' : 'Ciclo ativo'}
                </span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {activeClub.work_title}
                </h1>
                {activeClub.work_author && (
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>por {activeClub.work_author}</p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {activeClub.theme && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(200,144,26,0.12)', border: '1px solid rgba(200,144,26,0.2)', padding: '0.2rem 0.7rem', borderRadius: '99px' }}>
                      {activeClub.theme}
                    </span>
                  )}
                  {isMeetingToday && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', background: 'var(--red)', padding: '0.2rem 0.7rem', borderRadius: '99px' }}>
                      Encontro hoje
                    </span>
                  )}
                  {hasRecording && meetingPast && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--green)', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', padding: '0.2rem 0.7rem', borderRadius: '99px' }}>
                      Gravação disponível
                    </span>
                  )}
                </div>
                {activeClub.headline && (
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.75)', marginTop: '1rem', lineHeight: 1.5, maxWidth: '540px' }}>
                    {activeClub.headline}
                  </p>
                )}
              </div>
              {(activeClub.mockup_url || activeClub.cover_url) && (
                <div style={{ flexShrink: 0, paddingBottom: '0.5rem' }}>
                  <img
                    src={activeClub.mockup_url ?? activeClub.cover_url}
                    alt={activeClub.work_title}
                    style={{ width: '130px', borderRadius: '8px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', display: 'block' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Main content */}
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>

              {/* Left column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Objetivo */}
                {activeClub.objective && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Objetivo do ciclo</span>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)' }}>{activeClub.objective}</p>
                  </div>
                )}

                {/* Resumo */}
                {activeClub.summary && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Resumo da obra</span>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)' }}>{activeClub.summary}</p>
                  </div>
                )}

                {/* Meta semanal atual */}
                {activeClub.status === 'ativo' && currentGoal && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span className="label">Semana {currentWeek} — Meta atual</span>
                      {currentGoal.theme && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', background: 'rgba(200,144,26,0.1)', padding: '0.15rem 0.6rem', borderRadius: '99px' }}>
                          {currentGoal.theme}
                        </span>
                      )}
                    </div>
                    {currentGoal.title && (
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', letterSpacing: '0.02em', marginBottom: '0.5rem' }}>
                        {currentGoal.title}
                      </h3>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                      <span>Páginas {currentGoal.page_start}–{currentGoal.page_end}</span>
                    </div>
                    {currentGoal.description && (
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text)', marginBottom: '0.75rem' }}>
                        {currentGoal.description}
                      </p>
                    )}
                    {currentGoal.guide_question && (
                      <div style={{ background: 'rgba(200,144,26,0.06)', border: '1px solid rgba(200,144,26,0.15)', borderRadius: '8px', padding: '0.9rem 1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                          <MessageCircle size={14} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.55, margin: 0 }}>
                            <strong>Pergunta-guia:</strong> {currentGoal.guide_question}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pergunta da semana */}
                {activeClub.status === 'ativo' && activeClub.week_question && (
                  <div style={{ background: 'rgba(200,144,26,0.05)', border: '1px solid rgba(200,144,26,0.2)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Pergunta da semana</span>
                    <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: 'var(--text)', fontStyle: 'italic' }}>
                      "{activeClub.week_question}"
                    </p>
                  </div>
                )}

                {/* Progresso coletivo */}
                {activeClub.total_pages && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Progresso coletivo da leitura</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                      <span>Página {activeClub.current_page ?? 0} de {activeClub.total_pages}</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{progressPct}%</span>
                    </div>
                    <div className="prog-bar" style={{ height: '8px', marginBottom: '0.75rem' }}>
                      <div className="prog-fill" style={{ width: `${progressPct}%`, background: 'var(--gold)' }} />
                    </div>

                    {/* My progress */}
                    {hasJoined && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.35rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                          <span>Meu progresso — página {myProgress.current_page} de {activeClub.total_pages}</span>
                          <span style={{ color: isConcluded ? 'var(--green)' : 'var(--gold)', fontWeight: 700 }}>
                            {isConcluded ? 'Concluído ✓' : `${myProgressPct}%`}
                          </span>
                        </div>
                        <div className="prog-bar" style={{ height: '5px' }}>
                          <div className="prog-fill" style={{ width: `${myProgressPct}%`, background: isConcluded ? 'var(--green)' : 'var(--gold)', opacity: 0.7 }} />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Widget interativo de progresso */}
                {activeClub.status === 'ativo' && (
                  <ProgressWidget
                    cycleId={activeClub.id}
                    totalPages={activeClub.total_pages}
                    myProgress={myProgress}
                    hasJoined={hasJoined}
                    isConcluded={isConcluded}
                    xpReward={activeClub.xp_reward}
                  />
                )}

                {/* Todas as metas semanais */}
                {weeklyGoals.length > 1 && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Cronograma de leitura</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {weeklyGoals.map((g: any) => (
                        <div key={g.id} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.75rem', borderRadius: '8px',
                          background: g.week_number === currentWeek ? 'rgba(200,144,26,0.06)' : 'transparent',
                          border: `1px solid ${g.week_number === currentWeek ? 'rgba(200,144,26,0.2)' : 'transparent'}`,
                        }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                            background: g.week_number < currentWeek ? 'var(--green)' : g.week_number === currentWeek ? 'var(--gold)' : 'var(--card-2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 700, color: g.week_number <= currentWeek ? 'var(--bg)' : 'var(--muted)',
                          }}>
                            {g.week_number < currentWeek ? '✓' : g.week_number}
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.85rem', display: 'block' }}>
                              {g.title || `Semana ${g.week_number}`}
                            </strong>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                              Páginas {g.page_start}–{g.page_end}
                              {g.theme && ` · ${g.theme}`}
                            </span>
                          </div>
                          {g.week_number === currentWeek && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--gold)', background: 'rgba(200,144,26,0.1)', padding: '0.15rem 0.5rem', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                              Atual
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Materiais */}
                {materials.length > 0 && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Materiais de apoio</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {materials.map((m: any) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.9rem', background: 'var(--card-2)', borderRadius: '8px' }}>
                          <div style={{ color: 'var(--muted)', flexShrink: 0 }}>{materialIcon(m.material_type)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: '0.85rem', display: 'block' }}>{m.title}</strong>
                            {m.description && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{m.description}</span>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.68rem', color: 'var(--muted)', background: 'var(--card)', padding: '0.1rem 0.45rem', borderRadius: '99px' }}>
                                {materialTypeLabel(m.material_type)}
                              </span>
                              {m.xp_reward > 0 && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--gold)' }}>+{m.xp_reward} XP</span>
                              )}
                              {m.visibility === 'publico' && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--green)' }}>Público</span>
                              )}
                            </div>
                          </div>
                          {m.url && (
                            <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn-ghost sm" style={{ flexShrink: 0 }}>
                              <ExternalLink size={12} />
                              Abrir
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {materials.length === 0 && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Materiais de apoio</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                      Guias de leitura, PDFs, áudios e perguntas de debate serão disponibilizados durante o ciclo.
                    </p>
                  </div>
                )}

                {/* Encontro / Gravação */}
                {activeClub.meeting_date && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Encontro ao vivo</span>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: hasRecording && meetingPast ? '1rem' : 0 }}>
                      <div style={{ width: '44px', height: '44px', background: isMeetingToday ? 'rgba(239,68,68,0.1)' : 'rgba(200,144,26,0.1)', border: `1px solid ${isMeetingToday ? 'rgba(239,68,68,0.25)' : 'rgba(200,144,26,0.2)'}`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Calendar size={18} color={isMeetingToday ? 'var(--red)' : 'var(--gold)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                          {meetingPast ? 'Encontro realizado' : 'Próximo encontro'}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'capitalize', display: 'block', marginBottom: '0.5rem' }}>
                          {new Date(activeClub.meeting_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {activeClub.meeting_description && (
                          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.55, marginBottom: '0.75rem' }}>
                            {activeClub.meeting_description}
                          </p>
                        )}
                        {!meetingPast && activeClub.meeting_link && (
                          <a href={activeClub.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                            <Video size={13} />
                            {isMeetingToday ? 'Entrar agora' : 'Salvar link'}
                          </a>
                        )}
                      </div>
                    </div>

                    {hasRecording && meetingPast && (
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <div style={{ width: '44px', height: '44px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PlayCircle size={18} color="var(--green)" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Gravação disponível</strong>
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Assista quando quiser</span>
                          </div>
                          <a href={activeClub.meeting_recording_url} target="_blank" rel="noopener noreferrer" className="btn-ghost sm">
                            <PlayCircle size={12} />
                            Assistir
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '84px' }}>

                {/* Entrar no Clube */}
                {!hasJoined && activeClub.status === 'ativo' && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', textAlign: 'center' }}>
                    <Target size={24} color="var(--gold)" style={{ marginBottom: '0.5rem' }} />
                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Participe deste ciclo</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '1rem' }}>
                      Registre seu progresso e ganhe {activeClub.xp_reward} XP ao concluir.
                    </span>
                    <ProgressWidget
                      cycleId={activeClub.id}
                      totalPages={activeClub.total_pages}
                      myProgress={null}
                      hasJoined={false}
                      isConcluded={false}
                      xpReward={activeClub.xp_reward}
                      compact
                    />
                  </div>
                )}

                {/* Meu status */}
                {hasJoined && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Minha leitura</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {isConcluded
                        ? <CheckCircle size={16} color="var(--green)" />
                        : <Clock size={16} color="var(--gold)" />
                      }
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isConcluded ? 'var(--green)' : 'var(--text)' }}>
                        {isConcluded ? 'Obra concluída!' : `Página ${myProgress.current_page}${activeClub.total_pages ? ` de ${activeClub.total_pages}` : ''}`}
                      </span>
                    </div>
                    {activeClub.xp_reward > 0 && !isConcluded && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>
                        +{activeClub.xp_reward} XP ao concluir
                      </span>
                    )}
                    {isConcluded && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Star size={13} color="var(--gold)" />
                        <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>+{activeClub.xp_reward} XP conquistados</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sobre o ciclo */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
                  <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Sobre este ciclo</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                    {activeClub.work_author && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Autor</span>
                        <span style={{ color: 'var(--text)' }}>{activeClub.work_author}</span>
                      </div>
                    )}
                    {activeClub.total_pages && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Páginas</span>
                        <span style={{ color: 'var(--text)' }}>{activeClub.total_pages}</span>
                      </div>
                    )}
                    {weeklyGoals.length > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Semanas</span>
                        <span style={{ color: 'var(--text)' }}>{weeklyGoals.length}</span>
                      </div>
                    )}
                    {activeClub.start_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Início</span>
                        <span style={{ color: 'var(--text)' }}>{new Date(activeClub.start_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {activeClub.end_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Término</span>
                        <span style={{ color: 'var(--text)' }}>{new Date(activeClub.end_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {activeClub.xp_reward > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Recompensa</span>
                        <span style={{ color: 'var(--gold)', fontWeight: 700 }}>+{activeClub.xp_reward} XP</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--muted)' }}>Status</span>
                      <span style={{ color: activeClub.status === 'ativo' ? 'var(--green)' : 'var(--muted)', fontWeight: 600, textTransform: 'capitalize' }}>
                        {activeClub.status === 'ativo' ? 'Ativo' : 'Em breve'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Grupo WhatsApp */}
                {activeClub.whatsapp_group_url && (
                  <div>
                    <a
                      href={activeClub.whatsapp_group_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--r)', padding: '1rem 1.1rem', textDecoration: 'none', marginBottom: '0.75rem' }}
                    >
                      <div style={{ width: '36px', height: '36px', background: 'rgba(37,211,102,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Users size={16} color="var(--green)" />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)' }}>Grupo do Clube</strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Entrar no WhatsApp</span>
                      </div>
                      <ChevronRight size={14} color="var(--muted)" style={{ marginLeft: 'auto' }} />
                    </a>

                    {/* Regras do grupo */}
                    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.1rem' }}>
                      <span className="label" style={{ marginBottom: '0.75rem', display: 'block', fontSize: '0.65rem' }}>Regras do grupo</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {WHATSAPP_RULES.map((r, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '0.9rem', flexShrink: 0 }}>{r.emoji}</span>
                            <div>
                              <strong style={{ fontSize: '0.77rem', display: 'block' }}>{r.rule}</strong>
                              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>{r.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '3rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span className="label">Ciclo atual</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1 }}>Clube da Leitura</h1>
          </div>
          <div className="empty-state">
            <BookOpen size={48} color="var(--muted)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Nenhum ciclo ativo</h3>
            <p style={{ color: 'var(--muted)' }}>A próxima obra será anunciada em breve.</p>
          </div>
        </div>
      )}

      {/* Ciclos anteriores */}
      {pastCycles && pastCycles.length > 0 && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--pad)', paddingTop: activeClub ? '2rem' : '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.03em', marginBottom: '1rem' }}>Ciclos anteriores</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {pastCycles.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem', alignItems: 'center' }}>
                {(c.cover_url || c.mockup_url) ? (
                  <img src={c.cover_url ?? c.mockup_url} alt={c.work_title} style={{ width: '52px', height: '72px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '52px', height: '72px', background: 'var(--card-2)', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={20} color="var(--muted)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.2rem' }}>{c.work_title}</strong>
                  {c.work_author && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>por {c.work_author}</span>}
                  {c.meeting_date && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                      {new Date(c.meeting_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
