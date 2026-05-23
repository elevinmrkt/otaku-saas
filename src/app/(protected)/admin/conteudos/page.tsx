import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Edit, Video, FileText, Headphones, BookOpen, Radio } from 'lucide-react'
import ContentForm from '@/components/admin/ContentForm'
import DeleteContentButton from '@/components/admin/DeleteContentButton'
import { ContentFilters } from '@/components/admin/ContentFilters'
import type { ContentType } from '@/types/database'

const TYPE_ICON: Record<string, React.ReactNode> = {
  video:    <Video size={12} />,
  pdf:      <FileText size={12} />,
  audio:    <Headphones size={12} />,
  podcast:  <Headphones size={12} />,
  pagina:   <BookOpen size={12} />,
  gravacao: <Radio size={12} />,
}

function ytThumb(id: string) {
  return `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
}

export default async function AdminConteudos({
  searchParams,
}: {
  searchParams: Promise<{
    acao?: string; id?: string
    q?: string; tipo?: string; categoria?: string
    trilha?: string; status?: string; ordenar?: string
  }>
}) {
  const params = await searchParams
  const { acao, id } = params
  const supabase = await createClient()

  const [{ data: categories }, { data: trails }] = await Promise.all([
    supabase.from('categories').select('*').order('title'),
    supabase.from('trails').select('*').order('order_index'),
  ])

  let editItem = null
  if (acao === 'editar' && id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('content_items').select('*, media_assets(*)').eq('id', id).single() as any)
    editItem = data
  }

  if (acao === 'novo' || editItem) {
    return <ContentForm item={editItem} categories={categories ?? []} trails={trails ?? []} />
  }

  // Build query with filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('content_items')
    .select('*, categories(title), media_assets(youtube_video_id, url, asset_type)')

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`)
  }
  if (params.tipo) {
    query = query.eq('content_type', params.tipo as ContentType)
  }
  if (params.categoria) {
    query = query.eq('category_id', params.categoria)
  }
  if (params.trilha) {
    query = query.eq('trail_id', params.trilha)
  }
  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.ordenar === 'publicado') {
    query = query.order('published_at', { ascending: false, nullsFirst: false })
  } else if (params.ordenar === 'titulo') {
    query = query.order('title', { ascending: true })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data: items } = await query.limit(100)

  const currentFilters = {
    q: params.q ?? '',
    tipo: params.tipo ?? '',
    categoria: params.categoria ?? '',
    trilha: params.trilha ?? '',
    status: params.status ?? '',
    ordenar: params.ordenar ?? 'criado',
  }

  return (
    <div style={{ maxWidth: '1000px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
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

      <ContentFilters
        categories={categories ?? []}
        trails={trails ?? []}
        current={currentFilters}
      />

      {items && items.length > 0 ? (
        <>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
            {items.length} conteúdo{items.length !== 1 ? 's' : ''} encontrado{items.length !== 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {items.map((item: any) => {
              const ytId = item.media_assets?.find((a: any) => a.youtube_video_id)?.youtube_video_id
              const thumb = item.thumbnail_url ?? (ytId ? ytThumb(ytId) : null)
              const dateLabel = params.ordenar === 'publicado' && item.published_at
                ? `Publicado em ${new Date(item.published_at).toLocaleDateString('pt-BR')}`
                : `Criado em ${new Date(item.created_at).toLocaleDateString('pt-BR')}`

              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    background: 'var(--card)', border: '1px solid var(--border)',
                    borderRadius: 'var(--r)', padding: '0.75rem 1rem',
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: '80px', height: '52px', flexShrink: 0, borderRadius: '6px', overflow: 'hidden', background: 'var(--card-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>{TYPE_ICON[item.content_type]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem', alignItems: 'center' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: 'var(--muted)', background: 'var(--card-2)', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>
                        {TYPE_ICON[item.content_type]} {item.content_type}
                      </span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: item.status === 'publicado' ? 'var(--green)' : item.status === 'arquivado' ? 'var(--muted)' : 'var(--gold)' }}>
                        {item.status}
                      </span>
                      {item.categories?.title && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>
                          {item.categories.title}
                        </span>
                      )}
                      {item.xp_reward > 0 && (
                        <span className="xp-badge" style={{ fontSize: '0.62rem' }}>+{item.xp_reward} XP</span>
                      )}
                      <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                        {dateLabel}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                    <Link href={`/admin/conteudos?acao=editar&id=${item.id}`} className="btn-ghost sm">
                      <Edit size={13} />
                      Editar
                    </Link>
                    <DeleteContentButton id={item.id} title={item.title} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>
            {Object.values(currentFilters).some(v => v && v !== 'criado')
              ? 'Nenhum conteúdo encontrado com esses filtros.'
              : 'Nenhum conteúdo cadastrado. Clique em "Novo conteúdo" para começar.'}
          </p>
          {!Object.values(currentFilters).some(v => v && v !== 'criado') && (
            <Link href="/admin/conteudos?acao=novo" className="btn-primary">
              <Plus size={14} />
              Criar primeiro conteúdo
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
