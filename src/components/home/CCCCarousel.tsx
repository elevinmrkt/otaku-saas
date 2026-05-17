'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Play } from 'lucide-react'

interface ProgressItem {
  id: string
  progress_percent: number
  content_items: {
    id: string
    title: string
    slug: string
    content_type: string
    thumbnail_url: string | null
    description: string | null
  } | null
}

interface Props {
  items: ProgressItem[]
}

export default function CCCCarousel({ items }: Props) {
  const [active, setActive] = useState(0)
  const [trackOffset, setTrackOffset] = useState(0)
  const viewportRef = useRef<HTMLDivElement>(null)

  const recalc = (idx: number) => {
    if (!viewportRef.current) return
    const vw = viewportRef.current.clientWidth
    const itemW = Math.min(vw * 0.76, 920)
    const pad = (vw - itemW) / 2
    setTrackOffset(pad - idx * (itemW + 16))
  }

  useEffect(() => {
    recalc(active)
    const onResize = () => recalc(active)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  const prev = () => setActive(a => Math.max(0, a - 1))
  const next = () => setActive(a => Math.min(items.length - 1, a + 1))

  return (
    <section className="content-section continue-section">
      <div className="section-head inline">
        <div>
          <span className="label">De onde você parou</span>
          <h2>Continue estudando</h2>
        </div>
        <div className="ccc-controls">
          <button className="ccc-prev" onClick={prev} aria-label="Anterior" disabled={active === 0}>
            <ChevronLeft size={18} />
          </button>
          <button className="ccc-next" onClick={next} aria-label="Próximo" disabled={active === items.length - 1}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="ccc-viewport" ref={viewportRef}>
        <div
          className="ccc-track"
          style={{ transform: `translateX(${trackOffset}px)` }}
        >
          {items.map((prog, i) => {
            const item = prog.content_items
            if (!item) return null
            const isActive = i === active
            const isAdjacent = Math.abs(i - active) === 1
            return (
              <article
                key={prog.id}
                className={`ccc-item${isActive ? ' is-active' : ''}${isAdjacent ? ' is-adjacent' : ''}`}
                onClick={() => !isActive && setActive(i)}
              >
                <div className="ccc-thumb">
                  {item.thumbnail_url
                    ? <img src={item.thumbnail_url} alt={item.title} />
                    : <div style={{ width: '100%', height: '100%', background: 'var(--card-2)' }} />
                  }
                  <span className="ccc-type-badge">{item.content_type}</span>
                  <div className="ccc-progress-bar">
                    <div className="ccc-progress-fill" style={{ width: `${prog.progress_percent}%` }} />
                  </div>
                  <div className="ccc-hover-overlay">
                    <Link href={`/conteudo/${item.slug}`} className="ccc-play-btn">
                      <Play size={28} fill="white" />
                    </Link>
                  </div>
                  <div className="ccc-info">
                    <div className="ccc-summary">
                      <strong>{item.title}</strong>
                      <span>{prog.progress_percent}% concluído</span>
                    </div>
                    {item.description && (
                      <p className="ccc-overlay-meta">
                        {item.description.slice(0, 80)}{item.description.length > 80 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
