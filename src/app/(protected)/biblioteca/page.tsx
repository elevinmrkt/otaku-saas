import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Headphones, BookOpen } from 'lucide-react'

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string }>
}) {
  const { q, tipo } = await searchParams
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('content_items')
    .select('*, media_assets(*), categories(title, slug)')
    .eq('status', 'publicado')
    .in('content_type', ['pdf', 'audio', 'podcast', 'pagina'])
    .order('published_at', { ascending: false })

  if (q) query = query.ilike('title', `%${q}%`)
  if (tipo) query = query.eq('content_type', tipo)

  const { data: items } = await query

  const TIPOS = [
    { value: '', label: 'Todos' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'audio', label: 'Áudio' },
    { value: 'podcast', label: 'Podcasts' },
    { value: 'pagina', label: 'Artigos' },
  ]

  const ICON: Record<string, React.ReactNode> = {
    pdf: <FileText size={20} />,
    audio: <Headphones size={20} />,
    podcast: <Headphones size={20} />,
    pagina: <BookOpen size={20} />,
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 'var(--pad)', paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <span className="label">Materiais de apoio</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
            Biblioteca
          </h1>
        </div>

        {/* Filters */}
        <form method="GET" style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {TIPOS.map(t => (
            <button
              key={t.value}
              name="tipo"
              value={t.value}
              type="submit"
              style={{
                padding: '0.4rem 0.9rem', borderRadius: '6px',
                border: `1px solid ${tipo === t.value || (!tipo && !t.value) ? 'var(--red)' : 'var(--border)'}`,
                background: tipo === t.value || (!tipo && !t.value) ? 'rgba(229,9,20,0.1)' : 'var(--card-2)',
                color: 'var(--text)', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600,
                transition: 'all 150ms',
              }}
            >{t.label}</button>
          ))}
          <input
            name="q"
            defaultValue={q}
            placeholder="Buscar na biblioteca..."
            style={{
              background: 'var(--card-2)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text)',
              padding: '0.5rem 1rem', fontSize: '0.85rem', outline: 'none',
              minWidth: '200px',
            }}
          />
        </form>

        {items && items.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {items.map((item: any) => (
              <Link
                key={item.id}
                href={`/conteudo/${item.slug}`}
                className="card-lift"
                style={{
                  background: 'var(--card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', overflow: 'hidden', textDecoration: 'none',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                <div style={{ aspectRatio: '3/4', background: 'var(--card-2)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: 'var(--muted)', opacity: 0.3 }}>{ICON[item.content_type] ?? <BookOpen size={20} />}</div>
                  )}
                </div>
                <div style={{ padding: '0.85rem' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>
                    {item.content_type}
                  </div>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--text)', display: 'block', lineHeight: 1.3 }}>{item.title}</strong>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BookOpen size={48} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>Biblioteca em construção</h3>
            <p>Nenhum material disponível na biblioteca. Os grimórios e guias aparecerão aqui quando forem publicados.</p>
          </div>
        )}
      </div>
    </div>
  )
}
