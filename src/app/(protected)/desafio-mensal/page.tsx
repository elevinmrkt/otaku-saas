import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Flame, CheckCircle, Users, Calendar } from 'lucide-react'
import ChallengeTaskList from '@/components/home/ChallengeTaskList'

export default async function DesafioMensalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: challenge } = await supabase.from('challenges').select('*').eq('status', 'ativo').single()
  const { data: pastChallenges } = await supabase.from('challenges').select('*').eq('status', 'encerrado').order('end_date', { ascending: false }).limit(3)

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
  const daysPassed = startDate ? Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
  const currentDay = Math.min(daysPassed, challenge?.duration_days ?? 30)
  const completedTasks = userProgress.filter(p => p.status === 'concluido').length

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {challenge ? (
          <>
            {/* Hero */}
            <div
              style={{
                position: 'relative',
                background: challenge.poster_url ? 'var(--card)' : 'linear-gradient(135deg, rgba(229,9,20,0.15) 0%, var(--card) 100%)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', overflow: 'hidden',
                padding: '2.5rem',
                marginBottom: '2rem',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '2rem',
                alignItems: 'center',
              }}
            >
              {challenge.poster_url && (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.15 }}>
                  <img src={challenge.poster_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ position: 'relative' }}>
                <span className="label">Protocolo mensal</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)', marginBottom: '0.75rem' }}>
                  {challenge.title}
                </h1>
                <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '500px', marginBottom: '1.25rem' }}>
                  {challenge.description || challenge.headline}
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  {challenge.whatsapp_group_url && (
                    <a href={challenge.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      <Users size={14} />
                      Entrar no grupo
                    </a>
                  )}
                  {challenge.meeting_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      <Calendar size={13} />
                      Call: {new Date(challenge.meeting_date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>

              {/* Ring */}
              <div style={{ position: 'relative', flexShrink: 0, textAlign: 'center' }}>
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52" fill="none" stroke="var(--gold)" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="326.7"
                    strokeDashoffset={326.7 - (326.7 * (currentDay / (challenge.duration_days ?? 30)))}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 600ms ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--text)' }}>Dia {currentDay}</strong>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>de {challenge.duration_days}</span>
                </div>
              </div>
            </div>

            {/* Tasks */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'start' }}>
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
              <div
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '1.25rem',
                  minWidth: '200px', textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--red)', lineHeight: 1 }}>{completedTasks}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>concluídas</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>de {tasks.length} missões</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <span className="label">Protocolo mensal</span>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
                Desafio Mensal
              </h1>
            </div>
            <div className="empty-state">
              <Flame size={48} />
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Nenhum desafio ativo</h3>
              <p>A próxima missão será anunciada pela equipe. Fique de olho na comunidade.</p>
            </div>
          </>
        )}

        {/* Past challenges */}
        {pastChallenges && pastChallenges.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.03em', color: 'var(--text)', marginBottom: '1rem' }}>
              Desafios anteriores
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pastChallenges.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem 1.25rem' }}>
                  <CheckCircle size={18} color="var(--green)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{c.title}</strong>
                    {c.end_date && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Encerrado em {new Date(c.end_date).toLocaleDateString('pt-BR')}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
