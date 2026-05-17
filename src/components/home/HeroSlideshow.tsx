'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ContentItem } from '@/types/database'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  items: ContentItem[]
}

const TYPE_LABEL: Record<string, string> = {
  video: 'Aula',
  podcast: 'Podcast',
  audio: 'Áudio',
  pdf: 'PDF',
  pagina: 'Artigo',
  gravacao: 'Gravação',
}

export default function HeroSlideshow({ items }: Props) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const timer = setInterval(() => setActive(a => (a + 1) % items.length), 6000)
    return () => clearInterval(timer)
  }, [items.length])

  const prev = () => setActive(a => (a - 1 + items.length) % items.length)
  const next = () => setActive(a => (a + 1) % items.length)

  return (
    <section className="destaques-hero">
      {items.map((item, i) => (
        <div key={item.id} className={`dh-slide${i === active ? ' is-active' : ''}`}>
          <div className="dh-bg">
            {item.poster_url || item.thumbnail_url ? (
              <img src={item.poster_url || item.thumbnail_url || ''} alt={item.title} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0505 100%)' }} />
            )}
          </div>
          <div className="dh-overlay" />
          <div className="dh-body">
            <p className="dh-type label">
              {TYPE_LABEL[item.content_type] ?? item.content_type}
              {item.is_new && <span className="badge-new" style={{ marginLeft: '0.5rem' }}>Novo</span>}
            </p>
            <h2 className="dh-title">{item.title}</h2>
            {item.description && (
              <p className="dh-desc">
                {item.description.slice(0, 140)}{item.description.length > 140 ? '...' : ''}
              </p>
            )}
            {item.xp_reward > 0 && (
              <div className="dh-stats">
                <span className="xp-badge">+{item.xp_reward} XP</span>
              </div>
            )}
            <div className="dh-actions">
              <Link href={`/conteudo/${item.slug}`} className="btn-primary">
                <Play size={15} fill="white" />
                {item.content_type === 'podcast' || item.content_type === 'audio' ? 'Ouvir agora' : item.content_type === 'pdf' ? 'Ler agora' : 'Assistir agora'}
              </Link>
            </div>
          </div>
        </div>
      ))}

      <div className="dh-letterbox bottom" aria-hidden="true" />

      {items.length > 1 && (
        <>
          <button className="dh-arrow dh-prev" onClick={prev} aria-label="Slide anterior">
            <ChevronLeft size={20} />
          </button>
          <button className="dh-arrow dh-next" onClick={next} aria-label="Próximo slide">
            <ChevronRight size={20} />
          </button>
          <div className="dh-dots">
            {items.map((_, i) => (
              <button
                key={i}
                className={`dh-dot${i === active ? ' is-active' : ''}`}
                onClick={() => setActive(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
