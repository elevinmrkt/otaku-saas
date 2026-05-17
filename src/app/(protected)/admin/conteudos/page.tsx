import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit } from 'lucide-react'
import ContentForm from '@/components/admin/ContentForm'
import DeleteContentButton from '@/components/admin/DeleteContentButton'

export default async function AdminConteudos({
  searchParams,
}: {
  searchParams: Promise<{ acao?: string; id?: string }>
}) {
  const { acao, id } = await searchParams
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase
    .from('content_items')
    .select('*, categories(title), media_assets(youtube_video_id, url, asset_type)')
    .order('created_at', { ascending: false })
    .limit(50) as any)

  const { data: categories } = await supabase.from('categories').select('*').order('title')
  const { data: trails } = await supabase.from('trails').select('id, title').eq('status', 'publicado').order('order_index')

  let editItem = null
  if (acao === 'editar' && id) {
    const { data } = await (supabase.from('content_items').select('*, media_assets(*)').eq('id', id).single() as any)
    editItem = data
  }

  if (acao === 'novo' || editItem) {
    return <ContentForm item={editItem} categories={categories ?? []} trails={trails ?? []} />
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <span className="label">Gestão</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
            Conteúdos
          </h1>
        </div>
        <Link href="/admin/conteudos?acao=novo" className="btn-primary">
          <Plus size={14} />
          Novo conteúdo
        </Link>
      </div>

      {items && items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {items.map((item: any) => (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '0.9rem 1.1rem',
              }}
            >
              {item.thumbnail_url && (
                <img src={item.thumbnail_url} alt="" style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text)' }}>{item.title}</strong>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--muted)', background: 'var(--card-2)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {item.content_type}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: item.status === 'publicado' ? 'var(--green)' : 'var(--muted)', fontWeight: 700 }}>
                    {item.status}
                  </span>
                  {item.xp_reward > 0 && (
                    <span className="xp-badge" style={{ fontSize: '0.65rem' }}>+{item.xp_reward} XP</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <Link href={`/admin/conteudos?acao=editar&id=${item.id}`} className="btn-ghost sm">
                  <Edit size={13} />
                  Editar
                </Link>
                <DeleteContentButton id={item.id} title={item.title} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>Nenhum conteúdo cadastrado. Clique em "Novo conteúdo" para começar.</p>
          <Link href="/admin/conteudos?acao=novo" className="btn-primary">
            <Plus size={14} />
            Criar primeiro conteúdo
          </Link>
        </div>
      )}
    </div>
  )
}
