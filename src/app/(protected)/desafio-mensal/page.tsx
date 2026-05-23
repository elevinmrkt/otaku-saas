import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Flame, CheckCircle, Users, Calendar, Video, Lock, ChevronRight } from 'lucide-react'
import ChallengeTaskList from '@/components/home/ChallengeTaskList'
import { canAccess, PLAN_LABELS, PLAN_COLORS } from '@/lib/plans'
import type { UserPlan, RequiredPlan } from '@/lib/plans'

export default async function DesafioMensalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: dbUser } = await supabase.from('users').select('plan, role').eq('id', user.id).single()
  const userPlan = (dbUser?.plan ?? 'nenhum') as UserPlan
  const isAdmin = ['admin', 'editor', 'mentor', 'suporte'].includes(dbUser?.role ?? '')

  const { data: challengeRows } = await supabase.from('challenges').select('*').in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).limit(1) as any
  const challenge: any = (challengeRows as any[])?.[0] ?? null
  const { data: pastChallenges } = await supabase.from('challenges').select('*').eq('status', 'encerrado').order('end_date', { ascending: false }).limit(5)

  const challengeRequiredPlan = (challenge?.required_plan ?? 'mensal') as RequiredPlan
  const challengeLocked = challenge && !isAdmin && !canAccess(userPlan, challengeRequiredPlan)
  const planColor = PLAN_COLORS[challengeRequiredPlan]

  let tasks: any[] = []
  let userProgress: any[] = []
  if (challenge) {
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from('challenge_tasks').select('*').eq('challenge_id', challenge.id).order('day_number'),
      supabase.from('user_challenge_progress').select('*').eq('user_id', user.id).eq('challenge_id', challenge.id),
    ])
    tasks = t ?? []
    userProgress = p ?? []
  }

  const now = new Date()
  const startDate = challenge?.start_date ? new Date(challenge.start_date) : null
  const daysPassed = startDate ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 1
  const currentDay = Math.max(1, Math.min(daysPassed, challenge?.duration_days ?? 30))
  const completedTasks = userProgress.filter(p => p.status === 'concluido').length
  const progressPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const ringCircumference = 326.7

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>

      {challengeLocked ? (
        <div style={{ maxWidth: '700px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: planColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={28} color={planColor.color} />
          </div>
          <span className="label">Protocolo mensal</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '0.04em', lineHeight: 1 }}>
            {challenge.title}
          </h1>
          {challenge.headline && (
            <p style={{ color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.7 }}>{challenge.headline}</p>
          )}
          <div style={{ marginTop: '1rem', padding: '1.25rem 2rem', background: 'var(--card)', border: `1px solid ${planColor.color}30`, borderRadius: 'var(--r)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Este desafio é exclusivo do</span>
            <strong style={{ color: planColor.color, fontSize: '1.1rem' }}>Plano {PLAN_LABELS[challengeRequiredPlan]}</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Seu plano atual: {PLAN_LABELS[userPlan]}</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
            Entre em contato com a equipe para fazer upgrade do seu plano.
          </p>
        </div>
      ) : challenge ? (
        <>
          {/* Hero */}
          <div style={{ position: 'relative', minHeight: '380px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
            {challenge.poster_url && (
              <div style={{ position: 'absolute', inset: 0 }}>
                <img src={challenge.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(2px) brightness(0.2)' }} />
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,10,0.5) 60%, transparent 100%)' }} />
            <div style={{ position: 'relative', padding: 'var(--pad)', paddingBottom: '3rem', maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }}>
              <div>
                <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Protocolo mensal — Missão ativa</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {challenge.title}
                </h1>
                {challenge.headline && (
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.7)', maxWidth: '500px', marginBottom: '1rem', lineHeight: 1.5 }}>{challenge.headline}</p>
                )}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {challenge.whatsapp_group_url && (
                    <a href={challenge.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      <Users size={14} />
                      Entrar no grupo
                    </a>
                  )}
                  {challenge.meeting_link && (
                    <a href={challenge.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                      <Video size={14} />
                      Link da call
                    </a>
                  )}
                </div>
              </div>
              {/* Ring */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="var(--gold)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference - (ringCircumference * (currentDay / (challenge.duration_days ?? 30)))}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div style={{ marginTop: '-74px', marginBottom: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60px' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)' }}>Dia {currentDay}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>de {challenge.duration_days}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>

              {/* Coluna principal */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Como funciona */}
                {(challenge.description || challenge.objective) && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Sobre o desafio</span>
                    {challenge.description && (
                      <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)', marginBottom: challenge.objective ? '1rem' : 0 }}>{challenge.description}</p>
                    )}
                    {challenge.objective && (
                      <>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--gold)', display: 'block', marginBottom: '0.4rem' }}>Objetivo</strong>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.6, color: 'var(--text)' }}>{challenge.objective}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Progresso do membro */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                  <span className="label" style={{ marginBottom: '1rem', display: 'block' }}>Seu progresso</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                    <span>{completedTasks} de {tasks.length} tarefas concluídas</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{progressPct}%</span>
                  </div>
                  <div className="prog-bar" style={{ height: '8px' }}>
                    <div className="prog-fill" style={{ width: `${progressPct}%`, background: progressPct === 100 ? 'var(--green)' : 'var(--red)' }} />
                  </div>
                </div>

                {/* Missões do dia */}
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.03em', color: 'var(--text)', marginBottom: '1rem' }}>
                    Missões — Dia {currentDay}
                  </h2>
                  <ChallengeTaskList
                    challengeId={challenge.id}
                    tasks={tasks}
                    userProgress={userProgress}
                    currentDay={currentDay}
                  />
                </div>

              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '84px' }}>

                {/* Grupo do desafio */}
                {challenge.whatsapp_group_url && (
                  <a
                    href={challenge.whatsapp_group_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--r)', padding: '1.1rem 1.25rem', textDecoration: 'none' }}
                  >
                    <div style={{ width: '36px', height: '36px', background: 'rgba(37,211,102,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} color="var(--green)" />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)' }}>Grupo do desafio</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>WhatsApp da missão</span>
                    </div>
                    <ChevronRight size={14} color="var(--muted)" style={{ marginLeft: 'auto' }} />
                  </a>
                )}

                {/* Call de fechamento */}
                {challenge.meeting_date && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Encontro de fechamento</span>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <Calendar size={16} color="var(--gold)" />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text)', textTransform: 'capitalize' }}>
                        {new Date(challenge.meeting_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                    </div>
                    {challenge.meeting_link && (
                      <a href={challenge.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-ghost sm" style={{ width: '100%', justifyContent: 'center' }}>
                        <Video size={12} />
                        Acessar call
                      </a>
                    )}
                  </div>
                )}

                {/* Stats */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
                  <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Detalhes</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--muted)' }}>Duração</span>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{challenge.duration_days} dias</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--muted)' }}>Dia atual</span>
                      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{currentDay} de {challenge.duration_days}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--muted)' }}>XP ao concluir</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 600 }}>+{challenge.xp_reward} XP</span>
                    </div>
                    {challenge.start_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Início</span>
                        <span style={{ color: 'var(--text)' }}>{new Date(challenge.start_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    {challenge.end_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Encerramento</span>
                        <span style={{ color: 'var(--text)' }}>{new Date(challenge.end_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '3rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span className="label">Protocolo mensal</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1 }}>Desafio Mensal</h1>
          </div>
          <div className="empty-state">
            <Flame size={48} color="var(--muted)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Nenhum desafio ativo</h3>
            <p style={{ color: 'var(--muted)' }}>Nenhuma missão ativa agora. O próximo desafio será liberado pela equipe.</p>
          </div>
        </div>
      )}

      {/* Desafios anteriores */}
      {pastChallenges && pastChallenges.length > 0 && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.03em', marginBottom: '1rem' }}>Desafios anteriores</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {pastChallenges.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', background: 'rgba(229,9,20,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={18} color="var(--green)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', marginBottom: '0.2rem' }}>{c.title}</strong>
                  {c.headline && <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.headline}</p>}
                  {c.end_date && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      Encerrado em {new Date(c.end_date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 700, flexShrink: 0 }}>+{c.xp_reward} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
