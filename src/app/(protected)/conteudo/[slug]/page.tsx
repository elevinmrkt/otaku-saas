'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ContentItemWithAssets } from '@/types/database'
import { CheckCircle, ArrowLeft, Zap, Lock } from 'lucide-react'
import { canAccess, PLAN_LABELS, PLAN_COLORS } from '@/lib/plans'
import type { UserPlan, RequiredPlan } from '@/lib/plans'
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, '')
}

export default function ConteudoPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [item, setItem] = useState<ContentItemWithAssets | null>(null)
  const [progress, setProgress] = useState<{ status: string; progress_percent: number } | null>(null)
  const [reflection, setReflection] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [userPlan, setUserPlan] = useState<string>('nenhum')
  const [contentRequiredPlan, setContentRequiredPlan] = useState<string>('mensal')
  const videoProgressRef = useRef(0)
  const lastSavedPct = useRef(10)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: contentData } = await (supabase
        .from('content_items')
        .select('*, media_assets(*), categories(title, slug)')
        .eq('slug', slug)
        .eq('status', 'publicado')
        .single() as any)

      if (!contentData) { router.push('/home'); return }

      // Verificação de plano
      const { data: dbUser } = await supabase.from('users').select('plan, role').eq('id', user.id).single()
      const uPlan = (dbUser?.plan ?? 'nenhum') as UserPlan
      const isAdmin = ['admin', 'editor', 'mentor', 'suporte'].includes(dbUser?.role ?? '')
      const rPlan = (contentData.required_plan ?? 'mensal') as RequiredPlan
      setUserPlan(uPlan)
      setContentRequiredPlan(rPlan)
      if (!isAdmin && !canAccess(uPlan, rPlan)) {
        setLocked(true)
        setLoading(false)
        return
      }

      setItem(contentData as ContentItemWithAssets)

      const { data: progData } = await supabase
        .from('content_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_item_id', contentData.id)
        .single()

      if (progData) { setProgress(progData); setCompleted(progData.status === 'concluido') }
      if (!progData) {
        await supabase.from('content_progress').insert({
          user_id: user.id,
          content_item_id: contentData.id,
          status: 'em_andamento',
          progress_percent: 10,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function handleComplete() {
    if (!item || !userId || saving) return
    setSaving(true)
    const now = new Date().toISOString()

    if (item.requires_reflection && reflection.trim().length < 20) {
      alert('Escreva uma reflexão de pelo menos 20 caracteres para concluir.')
      setSaving(false)
      return
    }

    await supabase.from('content_progress').upsert({
      user_id: userId,
      content_item_id: item.id,
      status: 'concluido',
      progress_percent: 100,
      completed_at: now,
      updated_at: now,
    }, { onConflict: 'user_id,content_item_id' })

    if (reflection.trim().length >= 10) {
      await supabase.from('comments').insert({
        user_id: userId,
        content_item_id: item.id,
        body: reflection,
        comment_type: 'reflexao',
        status: 'ativo',
      })
    }

    if (item.xp_reward > 0) {
      await supabase.from('gamification_events').insert({
        user_id: userId,
        event_type: 'complete_content',
        xp_amount: item.xp_reward,
        reference_type: 'content_item',
        reference_id: item.id,
      })
      const { error: rpcErr } = await (supabase as any).rpc('increment_user_xp', { p_user_id: userId, p_xp: item.xp_reward })
      if (rpcErr) {
        // fallback: read current XP then update
        const { data: existing } = await supabase.from('user_xp_summary').select('total_xp').eq('user_id', userId).single()
        await supabase.from('user_xp_summary').upsert({
          user_id: userId,
          total_xp: (existing?.total_xp ?? 0) + item.xp_reward,
          level: 1,
          current_streak: 0,
          last_activity_at: now,
          updated_at: now,
        }, { onConflict: 'user_id' })
      }
    }

    setCompleted(true)
    setSaving(false)
  }

  // Tracker de progresso por tempo (salva em marcos)
  useEffect(() => {
    if (!userId || !item || completed) return
    const save = async (pct: number) => {
      if (pct <= lastSavedPct.current) return
      lastSavedPct.current = pct
      await supabase.from('content_progress').upsert({
        user_id: userId,
        content_item_id: item.id,
        status: 'em_andamento',
        progress_percent: pct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,content_item_id' })
    }
    const t1 = setTimeout(() => save(30), 60_000)
    const t2 = setTimeout(() => save(55), 180_000)
    const t3 = setTimeout(() => save(75), 420_000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, item?.id, completed])

  // Tracker de vídeo HTML5
  async function handleVideoTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget
    if (!video.duration || !userId || !item || completed) return
    const pct = Math.min(Math.round((video.currentTime / video.duration) * 100), 95)
    videoProgressRef.current = pct
    if (pct >= lastSavedPct.current + 10) {
      lastSavedPct.current = pct
      await supabase.from('content_progress').upsert({
        user_id: userId,
        content_item_id: item.id,
        status: 'em_andamento',
        progress_percent: pct,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,content_item_id' })
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Carregando...</div>
      </div>
    )
  }

  if (locked) {
    const planColor = PLAN_COLORS[contentRequiredPlan] ?? PLAN_COLORS.mensal
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--pad)', gap: '1rem', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: planColor.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={28} color={planColor.color} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em' }}>
          Conteúdo exclusivo
        </h1>
        <p style={{ color: 'var(--muted)', maxWidth: '400px', lineHeight: 1.7, fontSize: '0.92rem' }}>
          Este conteúdo é exclusivo do{' '}
          <strong style={{ color: planColor.color }}>Plano {PLAN_LABELS[contentRequiredPlan]}</strong>.
          Entre em contato com a equipe para fazer upgrade do seu plano.
        </p>
        <div style={{ padding: '0.85rem 1.5rem', background: planColor.bg, borderRadius: 'var(--r)', fontSize: '0.82rem', color: planColor.color, fontWeight: 700 }}>
          Seu plano atual: {PLAN_LABELS[userPlan]}
        </div>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, marginTop: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>
    )
  }

  if (!item) return null

  const videoAsset = item.media_assets?.find(a => a.asset_type === 'video' || a.youtube_video_id)
  const pdfAsset = item.media_assets?.find(a => a.asset_type === 'pdf')
  const audioAsset = item.media_assets?.find(a => a.asset_type === 'audio')
  const pageAsset = item.media_assets?.find(a => a.asset_type === 'page_content')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div style={{ padding: '1.5rem var(--pad) 0' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} />
          Voltar
        </button>
      </div>

      <div style={{ padding: 'var(--pad)', maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <span className="label">{item.content_type}</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)', marginBottom: '0.75rem' }}>
            {item.title}
          </h1>
          {item.description && (
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '600px' }}>
              {item.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' }}>
            {item.xp_reward > 0 && <span className="xp-badge"><Zap size={11} />+{item.xp_reward} XP ao concluir</span>}
            {completed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--green)', fontSize: '0.82rem', fontWeight: 700 }}>
                <CheckCircle size={14} />
                Concluído
              </span>
            )}
          </div>
        </div>

        {/* Vídeo YouTube */}
        {videoAsset?.youtube_video_id && (
          <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--card)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: '2rem' }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoAsset.youtube_video_id}?rel=0&modestbranding=1`}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}

        {/* Vídeo direto (mp4 hospedado) */}
        {videoAsset?.url && !videoAsset?.youtube_video_id && (
          <div style={{ width: '100%', background: 'var(--card)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: '2rem' }}>
            <video
              controls
              src={videoAsset.url}
              style={{ width: '100%', display: 'block', maxHeight: '540px' }}
              poster={item.thumbnail_url ?? undefined}
              onTimeUpdate={handleVideoTimeUpdate}
            >
              Seu navegador não suporta o player de vídeo.
            </video>
          </div>
        )}

        {/* PDF */}
        {pdfAsset?.url && (
          <div style={{ width: '100%', background: 'var(--card)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', background: 'var(--card-2)' }}>
              <a
                href={pdfAsset.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost sm"
                style={{ fontSize: '0.75rem' }}
              >
                Abrir em nova aba ↗
              </a>
            </div>
            <iframe src={pdfAsset.url} title={item.title} style={{ width: '100%', height: '620px', border: 'none' }} />
          </div>
        )}

        {/* Áudio */}
        {audioAsset?.url && (() => {
          const isSpotify = audioAsset.url.includes('spotify.com')
          const spotifyEmbed = isSpotify
            ? audioAsset.url.replace('open.spotify.com/', 'open.spotify.com/embed/').replace('/intl-pt/', '/').split('?')[0]
            : null
          return (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem', marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Player de áudio
              </p>
              {isSpotify ? (
                <iframe
                  src={spotifyEmbed!}
                  width="100%"
                  height="152"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ border: 'none', borderRadius: '12px' }}
                />
              ) : (
                <audio controls src={audioAsset.url} style={{ width: '100%' }} />
              )}
            </div>
          )
        })()}

        {/* Artigo / Página */}
        {pageAsset?.url && (
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(pageAsset.url) }}
            style={{ marginBottom: '2rem', padding: '2rem', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}
          />
        )}

        {/* Reflexão */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <span className="label" style={{ marginBottom: '1rem' }}>Reflexão</span>
          <label className="field">
            {item.requires_reflection ? 'Sua reflexão (obrigatória para concluir)' : 'Deixe sua reflexão (opcional)'}
            <textarea
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="O que este conteúdo te fez pensar? Qual insight levou?"
              disabled={completed}
            />
          </label>
        </div>

        {!completed ? (
          <button
            className="btn-primary"
            onClick={handleComplete}
            disabled={saving}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {saving ? 'Salvando...' : (
              <>
                <CheckCircle size={16} />
                Marcar como concluído{item.xp_reward > 0 ? ` (+${item.xp_reward} XP)` : ''}
              </>
            )}
          </button>
        ) : (
          <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={20} color="var(--green)" />
            <div>
              <strong style={{ color: 'var(--green)', display: 'block', fontSize: '0.9rem' }}>Conteúdo concluído!</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Seu progresso foi salvo.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
