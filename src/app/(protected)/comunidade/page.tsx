import { createClient } from '@/lib/supabase/server'
import { Users, ExternalLink } from 'lucide-react'

export default async function ComunidadePage() {
  const supabase = await createClient()
  const { data: groups } = await supabase.from('community_groups').select('*').eq('status', 'ativo').eq('visibility', 'publico').order('created_at')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <span className="label">Espaços de interação</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
            Comunidade
          </h1>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', maxWidth: '480px' }}>
            Os espaços oficiais da Guilda. Cada sala tem um propósito. Respeite as regras de cada uma.
          </p>
        </div>

        {groups && groups.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {groups.map((group: any) => (
              <div
                key={group.id}
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)', overflow: 'hidden',
                }}
              >
                {group.poster_url && (
                  <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                    <img src={group.poster_url} alt={group.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                  </div>
                )}
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        width: '36px', height: '36px', borderRadius: '8px',
                        background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Users size={16} color="var(--green)" />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {group.group_type}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.03em', marginBottom: '0.5rem' }}>
                    {group.title}
                  </h3>
                  {group.description && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                      {group.description}
                    </p>
                  )}
                  {group.rules && (
                    <div style={{ background: 'var(--card-2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem' }}>
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>{group.rules}</p>
                    </div>
                  )}
                  {group.whatsapp_url ? (
                    <a
                      href={group.whatsapp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary sm"
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      <ExternalLink size={13} />
                      Entrar no grupo
                    </a>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Link em breve</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Users size={48} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Nenhum grupo cadastrado ainda</h3>
            <p>Os links oficiais da comunidade serão adicionados pela administração em breve.</p>
          </div>
        )}
      </div>
    </div>
  )
}
