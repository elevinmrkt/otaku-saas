'use client'

import Link from 'next/link'
import type { ContentItem, Trail } from '@/types/database'
import { BookOpen, Play, Headphones, FileText } from 'lucide-react'

type ShelfItem = ContentItem | Trail

interface Props {
  items: ShelfItem[]
  type: 'content' | 'trail'
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Play size={14} />,
  pdf: <FileText size={14} />,
  audio: <Headphones size={14} />,
  podcast: <Headphones size={14} />,
  pagina: <BookOpen size={14} />,
  gravacao: <Play size={14} />,
}

export default function ContentShelf({ items, type }: Props) {
  return (
    <div className="shelf-viewport">
      <div className="shelf-track">
        {items.map(item => {
          const isTrail = type === 'trail'
          const href = isTrail ? `/trilhas/${(item as Trail).slug}` : `/conteudo/${(item as ContentItem).slug}`
          const thumb = (item as ContentItem).thumbnail_url || (item as Trail).thumbnail_url
          const label = isTrail ? 'Trilha' : (item as ContentItem).content_type

          return (
            <Link
              key={item.id}
              href={href}
              className="card-lift"
              style={{
                width: isTrail ? '240px' : '200px',
                flexShrink: 0,
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', overflow: 'hidden',
                textDecoration: 'none', display: 'block',
              }}
            >
              <div style={{ position: 'relative', aspectRatio: isTrail ? '2/3' : '16/9', background: 'var(--card-2)' }}>
                {thumb ? (
                  <img src={thumb} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={28} color="var(--muted)" style={{ opacity: 0.3 }} />
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }} />
                <span style={{
                  position: 'absolute', top: '0.5rem', left: '0.5rem',
                  background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                  padding: '0.2rem 0.45rem', borderRadius: '4px',
                  fontSize: '0.62rem', fontWeight: 800, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  display: 'flex', alignItems: 'center', gap: '0.25rem',
                }}>
                  {TYPE_ICON[label ?? ''] ?? <BookOpen size={10} />}
                  {label}
                </span>
                {(item as ContentItem).is_new && (
                  <span className="badge-new" style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>Novo</span>
                )}
              </div>
              <div style={{ padding: '0.75rem' }}>
                <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.3 }}>
                  {item.title}
                </strong>
                {item.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                    {item.description.slice(0, 60)}{item.description.length > 60 ? '...' : ''}
                  </p>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
