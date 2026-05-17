import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, Calendar } from 'lucide-react'

export default async function ClubeDaLeituraPage() {
  const supabase = await createClient()

  const { data: activeClub } = await supabase.from('book_club_cycles').select('*').eq('status', 'ativo').single()
  const { data: pastCycles } = await supabase.from('book_club_cycles').select('*').eq('status', 'encerrado').order('meeting_date', { ascending: false }).limit(5)

  const progressPct = activeClub && activeClub.total_pages
    ? Math.round(((activeClub.current_page ?? 0) / activeClub.total_pages) * 100) : 0

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2rem' }}>
          <span className="label">Ciclo atual</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
            Clube da Leitura
          </h1>
        </div>

        {activeClub ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '2rem', alignItems: 'start' }}>
            <div>
              <div
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)', padding: '2rem',
                  marginBottom: '1.5rem',
                }}
              >
                <span className="label">{activeClub.theme ?? 'Obra do mês'}</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', lineHeight: 1, marginBottom: '0.5rem' }}>
                  {activeClub.work_title}
                </h2>
                {activeClub.work_author && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1rem' }}>por {activeClub.work_author}</p>
                )}
                {activeClub.summary && (
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text)', marginBottom: '1.5rem' }}>{activeClub.summary}</p>
                )}

                {activeClub.total_pages && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>
                      <span>Página {activeClub.current_page ?? 0} de {activeClub.total_pages}</span>
                      <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{progressPct}%</span>
                    </div>
                    <div className="prog-bar">
                      <div className="prog-fill" style={{ width: `${progressPct}%`, background: 'var(--gold)' }} />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {activeClub.whatsapp_group_url && (
                    <a href={activeClub.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                      <Users size={14} />
                      Entrar no grupo do clube
                    </a>
                  )}
                  {activeClub.meeting_link && (
                    <a href={activeClub.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                      <Calendar size={14} />
                      Próximo encontro
                    </a>
                  )}
                </div>
              </div>

              {activeClub.meeting_date && (
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(200,144,26,0.12)', border: '1px solid rgba(200,144,26,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Calendar size={20} color="var(--gold)" />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem' }}>Próximo encontro</strong>
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {new Date(activeClub.meeting_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cover */}
            {(activeClub.mockup_url || activeClub.cover_url) && (
              <div style={{ position: 'sticky', top: '84px' }}>
                <div style={{ borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}>
                  <img
                    src={activeClub.mockup_url ?? activeClub.cover_url ?? ''}
                    alt={activeClub.work_title}
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Clube ainda não iniciado</h3>
            <p>A obra do mês aparecerá aqui quando for definida pela equipe.</p>
          </div>
        )}

        {pastCycles && pastCycles.length > 0 && (
          <div style={{ marginTop: '3rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.03em', marginBottom: '1rem' }}>
              Ciclos anteriores
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pastCycles.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem 1.25rem' }}>
                  <BookOpen size={16} color="var(--muted)" />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>{c.work_title}</strong>
                    {c.meeting_date && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{new Date(c.meeting_date).toLocaleDateString('pt-BR')}</div>}
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
