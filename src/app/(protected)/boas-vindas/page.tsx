'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function BoasVindasPage() {
  const router = useRouter()
  const supabase = createClient()
  const [videoConfig, setVideoConfig] = useState<{ youtube_video_id: string | null; title: string | null; comment_min_length: number } | null>(null)
  const [watched, setWatched] = useState(false)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('welcome_video_config').select('*').single().then(({ data }) => {
      setVideoConfig(data)
    })
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const minLen = videoConfig?.comment_min_length ?? 20
    if (comment.trim().length < minLen) {
      setError(`Escreva pelo menos ${minLen} caracteres para registrar sua reflexão.`)
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const now = new Date().toISOString()
    const [{ error: err }] = await Promise.all([
      supabase.from('users').update({ welcome_video_completed_at: now }).eq('id', user.id),
      supabase.from('onboarding_responses').upsert(
        { user_id: user.id, mirror_character: comment },
        { onConflict: 'user_id' }
      ),
    ])
    if (err) { setError('Erro ao salvar. Tente novamente.'); setLoading(false); return }
    router.push('/anamnese')
    router.refresh()
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg)', padding: '2rem',
        paddingTop: '6rem',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: '640px',
          animation: 'slide-up 400ms ease both',
        }}
      >
        <span className="label">Antes de continuar</span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)',
            marginBottom: '0.75rem',
          }}
        >
          Vídeo de boas-vindas
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: '2rem', maxWidth: '480px' }}>
          Assista ao vídeo e registre sua primeira reflexão para liberar a plataforma completa.
        </p>

        {/* Video player */}
        <div
          style={{
            width: '100%', aspectRatio: '16/9',
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', overflow: 'hidden',
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
          }}
        >
          {videoConfig?.youtube_video_id ? (
            <iframe
              src={`https://www.youtube.com/embed/${videoConfig.youtube_video_id}?rel=0&modestbranding=1`}
              title="Vídeo de boas-vindas"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 1rem', opacity: 0.3 }}>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <p style={{ fontSize: '0.9rem' }}>Vídeo de boas-vindas ainda não configurado.</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.3rem', opacity: 0.6 }}>O admin irá adicionar em breve.</p>
            </div>
          )}
        </div>

        {!watched && videoConfig?.youtube_video_id && (
          <button
            className="btn-ghost"
            onClick={() => setWatched(true)}
            style={{ marginBottom: '1.5rem', width: '100%', justifyContent: 'center' }}
          >
            ✓ Marcar vídeo como assistido
          </button>
        )}
        {!videoConfig?.youtube_video_id && (
          <button
            className="btn-ghost"
            onClick={() => setWatched(true)}
            style={{ marginBottom: '1.5rem', width: '100%', justifyContent: 'center' }}
          >
            ✓ Continuar sem vídeo
          </button>
        )}

        {/* Reflection form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '1.5rem',
            opacity: watched ? 1 : 0.4,
            transition: 'opacity 300ms',
            pointerEvents: watched ? 'auto' : 'none',
          }}
        >
          <label className="field">
            O que você espera construir dentro da comunidade?
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Escreva sua reflexão aqui... (mínimo 20 caracteres)"
              disabled={!watched}
              style={{ minHeight: '120px' }}
            />
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', color: comment.length >= (videoConfig?.comment_min_length ?? 20) ? 'var(--green)' : 'var(--muted)' }}>
              {comment.length} / {videoConfig?.comment_min_length ?? 20} caracteres
            </span>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button
            className="btn-primary"
            type="submit"
            disabled={!watched || loading}
            style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
          >
            {loading ? 'Salvando...' : 'Enviar reflexão e continuar'}
          </button>
        </form>
      </div>
    </main>
  )
}
