import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Filter } from 'lucide-react'

export default async function TrilhasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const { q, status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase.from('trails').select('*').eq('status', 'publicado').order('order_index')
  if (q) query = query.ilike('title', `%${q}%`)

  const { data: trails } = await query

  // Busca progresso do usuário por trilha
  const progressMap: Record<string, number> = {}
  if (trails && user) {
    const trailIds = trails.map(t => t.id)
    const { data: moduleContents } = await supabase
      .from('trail_module_contents')
      .select('content_item_id, trail_modules(trail_id)')
      .in('trail_modules.trail_id', trailIds)

    if (moduleContents) {
      const contentIds = moduleContents.map((mc: any) => mc.content_item_id)
      const { data: progresses } = await supabase
        .from('content_progress')
        .select('content_item_id, status')
        .eq('user_id', user.id)
        .in('content_item_id', contentIds)

      trails.forEach(trail => {
        const trailContentIds = moduleContents.filter((mc: any) => mc.trail_modules?.trail_id === trail.id).map((mc: any) => mc.content_item_id)
        const completed = progresses?.filter(p => trailContentIds.includes(p.content_item_id) && p.status === 'concluido').length ?? 0
        progressMap[trail.id] = trailContentIds.length > 0 ? Math.round((completed / trailContentIds.length) * 100) : 0
      })
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="label">Jornadas de conhecimento</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
              Trilhas
            </h1>
          </div>
          <form method="GET" style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar trilha..."
              style={{
                background: 'var(--card-2)', border: '1px solid var(--border)',
                borderRadius: '8px', color: 'var(--text)',
                padding: '0.6rem 1rem', fontSize: '0.88rem', outline: 'none',
                minWidth: '220px',
              }}
            />
            <button className="btn-ghost" type="submit" style={{ minHeight: '42px', padding: '0 1rem' }}>
              <Filter size={14} />
              Filtrar
            </button>
          </form>
        </div>

        {trails && trails.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {trails.map(trail => {
              const prog = progressMap[trail.id] ?? 0
              return (
                <Link
                  key={trail.id}
                  href={`/trilhas/${trail.slug}`}
                  className="card-lift"
                  style={{
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', overflow: 'hidden',
                    textDecoration: 'none', display: 'block',
                  }}
                >
                  <div style={{ position: 'relative', aspectRatio: '16/9', background: 'var(--card-2)' }}>
                    {trail.thumbnail_url ? (
                      <img src={trail.thumbnail_url} alt={trail.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={40} color="var(--muted)" style={{ opacity: 0.2 }} />
                      </div>
                    )}
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
                    {prog > 0 && (
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px' }}>
                        <div style={{ height: '100%', width: `${prog}%`, background: 'var(--red)' }} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.03em', color: 'var(--text)', marginBottom: '0.5rem' }}>
                      {trail.title}
                    </h3>
                    {trail.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                        {trail.description.slice(0, 80)}{trail.description.length > 80 ? '...' : ''}
                      </p>
                    )}
                    {prog > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Progresso</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--red)', fontWeight: 700 }}>{prog}%</span>
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Nenhuma trilha publicada ainda</h3>
            <p>Os primeiros conteúdos serão liberados em breve.</p>
          </div>
        )}
      </div>
    </div>
  )
}
