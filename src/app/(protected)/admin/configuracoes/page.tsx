'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Save, Play } from 'lucide-react'

export default function AdminConfiguracoes() {
  const supabase = createClient()
  const [videoId, setVideoId] = useState('')
  const [videoTitle, setVideoTitle] = useState('')
  const [minChars, setMinChars] = useState(20)
  const [configId, setConfigId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.from('welcome_video_config').select('*').single().then(({ data }) => {
      if (data) {
        setConfigId(data.id)
        setVideoId(data.youtube_video_id ?? '')
        setVideoTitle(data.title ?? '')
        setMinChars(data.comment_min_length ?? 20)
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    if (configId) {
      await supabase.from('welcome_video_config').update({
        youtube_video_id: videoId.trim(),
        title: videoTitle.trim() || null,
        comment_min_length: minChars,
        updated_at: new Date().toISOString(),
      } as any).eq('id', configId)
    } else {
      const { data } = await supabase.from('welcome_video_config').insert({
        youtube_video_id: videoId.trim(),
        title: videoTitle.trim() || null,
        comment_min_length: minChars,
        min_completion_percent: 80,
        requires_comment: true,
      } as any).select('id').single()
      if (data) setConfigId(data.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function extractId(input: string) {
    const match = input.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : input.trim()
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <span className="label">Gestão</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)' }}>
          Configurações
        </h1>
      </div>

      {/* Vídeo de boas-vindas */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Play size={16} color="var(--red)" />
          <strong style={{ fontSize: '0.95rem' }}>Vídeo de boas-vindas</strong>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Este vídeo é exibido para cada novo membro logo após o onboarding. Use um vídeo <strong>não listado</strong> no YouTube para que só membros acessem pelo link direto.
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label className="field">
            ID ou URL do vídeo no YouTube
            <input
              type="text"
              value={videoId}
              onChange={e => setVideoId(extractId(e.target.value))}
              placeholder="Ex: dQw4w9WgXcQ ou https://youtu.be/dQw4w9WgXcQ"
            />
            <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
              Aceita o ID direto ou a URL completa — extraímos o ID automaticamente.
            </small>
          </label>
          <label className="field">
            Título do vídeo (opcional)
            <input
              type="text"
              value={videoTitle}
              onChange={e => setVideoTitle(e.target.value)}
              placeholder="Ex: Bem-vindo ao Ecossistema Otaku Estóico"
            />
          </label>
          <label className="field">
            Mínimo de caracteres na reflexão
            <input
              type="number"
              min={10}
              max={500}
              value={minChars}
              onChange={e => setMinChars(Number(e.target.value))}
            />
            <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>
              Quantidade mínima de caracteres que o membro precisa escrever para liberar a plataforma.
            </small>
          </label>

          {videoId && (
            <div style={{ borderRadius: 'var(--r)', overflow: 'hidden', aspectRatio: '16/9', background: 'var(--card-2)' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                title="Preview"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'flex-start' }}
          >
            <Save size={14} />
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar configurações'}
          </button>
        </form>
      </div>
    </div>
  )
}
