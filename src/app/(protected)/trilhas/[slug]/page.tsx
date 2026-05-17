import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, Play, FileText, Headphones, ChevronRight } from 'lucide-react'

export default async function TrilhaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: trail } = await supabase.from('trails').select('*').eq('slug', slug).eq('status', 'publicado').single()
  if (!trail) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: modules } = await (supabase
    .from('trail_modules')
    .select('*, trail_module_contents(order_index, content_items(id, title, slug, content_type, thumbnail_url, description, xp_reward))')
    .eq('trail_id', trail.id)
    .order('order_index') as any)

  const allContentIds = (modules as any[])?.flatMap((m: any) => m.trail_module_contents?.map((c: any) => c.content_items?.id).filter(Boolean) ?? []) ?? []

  const progressMap: Record<string, 'em_andamento' | 'concluido'> = {}
  if (user && allContentIds.length > 0) {
    const { data: progs } = await supabase.from('content_progress').select('content_item_id, status').eq('user_id', user.id).in('content_item_id', allContentIds)
    progs?.forEach(p => { progressMap[p.content_item_id] = p.status as 'em_andamento' | 'concluido' })
  }

  const totalContents = allContentIds.length
  const completedContents = allContentIds.filter(id => progressMap[id] === 'concluido').length
  const progressPct = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0

  const ICON: Record<string, React.ReactNode> = {
    video: <Play size={14} />,
    pdf: <FileText size={14} />,
    audio: <Headphones size={14} />,
    podcast: <Headphones size={14} />,
    pagina: <BookOpen size={14} />,
    gravacao: <Play size={14} />,
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* Hero */}
      <div style={{ position: 'relative', minHeight: '360px', display: 'flex', alignItems: 'flex-end', padding: 'var(--pad)', paddingBottom: '2.5rem' }}>
        {trail.poster_url ? (
          <>
            <div style={{ position: 'absolute', inset: 0 }}>
              <img src={trail.poster_url} alt={trail.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 70%)' }} />
            </div>
          </>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--card) 0%, var(--bg) 100%)' }} />
        )}
        <div style={{ position: 'relative', zIndex: 5, maxWidth: '560px' }}>
          <span className="label">Trilha de aprendizado</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)', marginBottom: '0.75rem' }}>
            {trail.title}
          </h1>
          {trail.description && (
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '440px', marginBottom: '1.25rem' }}>
              {trail.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>
              {totalContents} conteúdos · {completedContents} concluídos
            </div>
            {totalContents > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="prog-bar" style={{ width: '120px' }}>
                  <div className="prog-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 700 }}>{progressPct}%</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div style={{ padding: '0 var(--pad)', maxWidth: '900px' }}>
        {modules && modules.length > 0 ? (
          (modules as any[]).map((module: any) => (
            <div key={module.id} style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.03em', color: 'var(--text)', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                {module.title}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(module.trail_module_contents ?? []).sort((a: any, b: any) => a.order_index - b.order_index).map((mc: any) => {
                  const item = mc.content_items
                  if (!item) return null
                  const prog = progressMap[item.id]
                  return (
                    <Link
                      key={item.id}
                      href={`/conteudo/${item.slug}`}
                      className={prog === 'concluido' ? 'card-hover-green' : 'card-hover'}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        background: 'var(--card)', border: `1px solid ${prog === 'concluido' ? 'rgba(37,211,102,0.2)' : 'var(--border)'}`,
                        borderRadius: 'var(--r)', padding: '0.9rem 1.1rem',
                        textDecoration: 'none',
                      }}
                    >
                      <div style={{
                        width: '36px', height: '36px', flexShrink: 0,
                        background: prog === 'concluido' ? 'rgba(37,211,102,0.15)' : 'var(--card-2)',
                        borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: prog === 'concluido' ? 'var(--green)' : 'var(--muted)',
                      }}>
                        {prog === 'concluido' ? '✓' : ICON[item.content_type] ?? <BookOpen size={14} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.3 }}>{item.title}</strong>
                        {item.description && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.15rem' }}>
                            {item.description.slice(0, 80)}{item.description.length > 80 ? '...' : ''}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        {item.xp_reward > 0 && <span className="xp-badge">+{item.xp_reward} XP</span>}
                        <ChevronRight size={16} color="var(--muted)" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <BookOpen size={40} />
            <p>Esta trilha ainda não tem conteúdos adicionados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
