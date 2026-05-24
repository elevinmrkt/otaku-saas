'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  trails: any[]
  progressMap: Record<string, number>
}

const GAP = 16

function getVisible() {
  if (typeof window === 'undefined') return 4
  if (window.innerWidth < 640) return 1
  if (window.innerWidth < 1024) return 2
  return 4
}

export default function TrailsCarousel({ trails, progressMap }: Props) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(4)
  const [cardWidth, setCardWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const recalc = () => {
    if (!containerRef.current) return
    const v = getVisible()
    const w = containerRef.current.clientWidth
    setVisible(v)
    setCardWidth((w - (v - 1) * GAP) / v)
  }

  useEffect(() => {
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const maxIndex = Math.max(0, trails.length - visible)
  const canPrev = index > 0
  const canNext = index < maxIndex
  const prev = () => setIndex(i => Math.max(0, i - 1))
  const next = () => setIndex(i => Math.min(maxIndex, i + 1))
  const offset = index * (cardWidth + GAP)

  return (
    <section className="content-section trails-section" id="trilhas">
      <div className="section-head inline">
        <div>
          <span className="label">Jornadas de conhecimento</span>
          <h2>Trilhas de aprendizado</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/trilhas" style={{ fontSize: '0.82rem', color: 'var(--muted)', fontWeight: 600 }}>
            Ver todas →
          </Link>
          {maxIndex > 0 && (
            <div className="ccc-controls">
              <button className="ccc-prev" onClick={prev} aria-label="Anterior" disabled={!canPrev} style={{ opacity: canPrev ? 1 : 0.35 }}>
                <ChevronLeft size={18} />
              </button>
              <button className="ccc-next" onClick={next} aria-label="Próximo" disabled={!canNext} style={{ opacity: canNext ? 1 : 0.35 }}>
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div ref={containerRef} style={{ overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            gap: `${GAP}px`,
            transform: `translateX(-${offset}px)`,
            transition: 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform',
          }}
        >
          {trails.map((trail, i) => {
            const prog = progressMap[trail.id] ?? 0
            return (
              <Link
                key={trail.id}
                href={`/trilhas/${trail.slug}`}
                className="trail-card"
                style={{
                  width: cardWidth > 0 ? `${cardWidth}px` : '25%',
                  minWidth: cardWidth > 0 ? `${cardWidth}px` : '220px',
                  flexShrink: 0,
                  minHeight: '440px',
                }}
              >
                <div className="trail-card-bg">
                  {trail.thumbnail_url
                    ? <img src={trail.thumbnail_url} alt={trail.title} />
                    : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, hsl(${i * 60},40%,10%) 0%, #0a0a0a 100%)` }} />
                  }
                </div>
                <div className="trail-card-body">
                  <div className="trail-card-top">
                    <span className="trail-label">Trilha {String(i + 1).padStart(2, '0')}</span>
                    {prog === 0 && <span className="trail-new-badge">Começar</span>}
                  </div>
                  <div className="trail-card-bottom">
                    <h3>{trail.title}</h3>
                    {trail.description && (
                      <p>{trail.description.slice(0, 70)}{trail.description.length > 70 ? '...' : ''}</p>
                    )}
                    {prog > 0 && (
                      <div className="trail-progress-row">
                        <div className="trail-prog-bar">
                          <div className="trail-prog-fill" style={{ width: `${prog}%` }} />
                        </div>
                        <span>{prog}%</span>
                      </div>
                    )}
                    <span className="trail-cta">{prog > 0 ? 'Continuar trilha →' : 'Iniciar trilha →'}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
