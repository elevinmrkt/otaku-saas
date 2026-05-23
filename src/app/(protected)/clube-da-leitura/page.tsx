import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Users, Calendar, Video, ChevronRight } from 'lucide-react'

export default async function ClubeDaLeituraPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activeClub } = await supabase.from('book_club_cycles').select('*').in('status', ['ativo', 'previsto']).order('created_at', { ascending: false }).maybeSingle()
  const { data: pastCycles } = await supabase.from('book_club_cycles').select('*').eq('status', 'encerrado').order('meeting_date', { ascending: false }).limit(6)

  const progressPct = activeClub?.total_pages
    ? Math.round(((activeClub.current_page ?? 0) / activeClub.total_pages) * 100) : 0

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '5rem' }}>

      {activeClub ? (
        <>
          {/* Hero */}
          <div style={{ position: 'relative', minHeight: '420px', display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
            {(activeClub.mockup_url || activeClub.cover_url) && (
              <div style={{ position: 'absolute', inset: 0 }}>
                <img
                  src={activeClub.mockup_url ?? activeClub.cover_url ?? ''}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', filter: 'blur(2px) brightness(0.25)' }}
                />
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,10,0.6) 60%, transparent 100%)' }} />
            <div style={{ position: 'relative', padding: 'var(--pad)', paddingBottom: '3rem', maxWidth: '900px', width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end' }}>
              <div>
                <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Clube da Leitura — Ciclo ativo</span>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 4rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)', marginBottom: '0.5rem' }}>
                  {activeClub.work_title}
                </h1>
                {activeClub.work_author && (
                  <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}>por {activeClub.work_author}</p>
                )}
                {activeClub.theme && (
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(200,144,26,0.12)', border: '1px solid rgba(200,144,26,0.2)', padding: '0.25rem 0.75rem', borderRadius: '99px' }}>
                    {activeClub.theme}
                  </span>
                )}
              </div>
              {(activeClub.mockup_url || activeClub.cover_url) && (
                <div style={{ flexShrink: 0, paddingBottom: '0.5rem' }}>
                  <img
                    src={activeClub.mockup_url ?? activeClub.cover_url ?? ''}
                    alt={activeClub.work_title}
                    style={{ width: '140px', borderRadius: '8px', boxShadow: '0 24px 60px rgba(0,0,0,0.7)', display: 'block' }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--pad)', paddingTop: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Resumo */}
                {activeClub.summary && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                    <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Resumo da obra</span>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text)' }}>{activeClub.summary}</p>
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
                    <div className="prog-bar" style={{ height: '8px' }}>
                      <div className="prog-fill" style={{ width: `${progressPct}%`, background: 'var(--gold)' }} />
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
                      Progresso atualizado pela equipe conforme a leitura avança.
                    </p>
                  </div>
                )}

                {/* Encontro ao vivo */}
                {activeClub.meeting_date && (
                  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', background: 'rgba(200,144,26,0.1)', border: '1px solid rgba(200,144,26,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={20} color="var(--gold)" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Próximo encontro</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--muted)', textTransform: 'capitalize' }}>
                        {new Date(activeClub.meeting_date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {activeClub.meeting_link && (
                      <a href={activeClub.meeting_link} target="_blank" rel="noopener noreferrer" className="btn-ghost sm" style={{ flexShrink: 0 }}>
                        <Video size={12} />
                        Entrar
                      </a>
                    )}
                  </div>
                )}

                {/* Materiais (placeholder) */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem' }}>
                  <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Materiais de apoio</span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                    Guias de leitura, PDFs, áudios e perguntas de debate serão disponibilizados pela equipe durante o ciclo.
                  </p>
                </div>

              </div>

              {/* Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '84px' }}>

                {/* Grupo do clube */}
                {activeClub.whatsapp_group_url && (
                  <a
                    href={activeClub.whatsapp_group_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--r)', padding: '1.1rem 1.25rem', textDecoration: 'none', transition: 'border-color 180ms' }}
                  >
                    <div style={{ width: '36px', height: '36px', background: 'rgba(37,211,102,0.12)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Users size={16} color="var(--green)" />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)' }}>Grupo do Clube</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Entrar no WhatsApp</span>
                    </div>
                    <ChevronRight size={14} color="var(--muted)" style={{ marginLeft: 'auto' }} />
                  </a>
                )}

                {/* Status do ciclo */}
                <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
                  <span className="label" style={{ marginBottom: '0.75rem', display: 'block' }}>Sobre este ciclo</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {activeClub.work_title && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Obra</span>
                        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{activeClub.work_title}</span>
                      </div>
                    )}
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
                    {activeClub.start_date && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span style={{ color: 'var(--muted)' }}>Início</span>
                        <span style={{ color: 'var(--text)' }}>{new Date(activeClub.start_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--muted)' }}>Status</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>Ativo</span>
                    </div>
                  </div>
                </div>

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
            <p style={{ color: 'var(--muted)' }}>Nenhum ciclo ativo no momento. A próxima obra será anunciada em breve.</p>
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
