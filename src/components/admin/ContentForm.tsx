'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import UploadButton from './UploadButton'
import ArticleEditor from './ArticleEditor'

interface Category { id: string; title: string; slug: string }
interface TrailOption { id: string; title: string }

interface Props {
  item?: any
  categories: Category[]
  trails: TrailOption[]
}

export default function ContentForm({ item, categories, trails }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: item?.title ?? '',
    slug: item?.slug ?? '',
    description: item?.description ?? '',
    content_type: item?.content_type ?? 'video',
    category_id: item?.category_id ?? '',
    trail_id: item?.trail_id ?? '',
    thumbnail_url: item?.thumbnail_url ?? '',
    poster_url: item?.poster_url ?? '',
    status: item?.status ?? 'rascunho',
    visibility: item?.visibility ?? 'publico',
    is_featured: item?.is_featured ?? false,
    is_new: item?.is_new ?? true,
    requires_reflection: item?.requires_reflection ?? false,
    xp_reward: item?.xp_reward ?? 20,
    youtube_video_id: item?.media_assets?.find((a: any) => a.youtube_video_id)?.youtube_video_id ?? '',
    video_url: item?.media_assets?.find((a: any) => a.asset_type === 'video' && a.url && !a.youtube_video_id)?.url ?? '',
    pdf_url: item?.media_assets?.find((a: any) => a.asset_type === 'pdf')?.url ?? '',
    audio_url: item?.media_assets?.find((a: any) => a.asset_type === 'audio')?.url ?? '',
    page_content: item?.media_assets?.find((a: any) => a.asset_type === 'page_content')?.url ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function generateSlug(title: string) {
    return title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.title || !form.slug) { setError('Título e slug são obrigatórios.'); return }
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const contentData = {
      title: form.title,
      slug: form.slug,
      description: form.description || null,
      content_type: form.content_type,
      category_id: form.category_id || null,
      trail_id: form.trail_id || null,
      thumbnail_url: form.thumbnail_url || null,
      poster_url: form.poster_url || null,
      status: form.status,
      visibility: form.visibility,
      is_featured: form.is_featured,
      is_new: form.is_new,
      requires_reflection: form.requires_reflection,
      xp_reward: Number(form.xp_reward),
      created_by: user.id,
      updated_at: new Date().toISOString(),
      published_at: form.status === 'publicado' ? (item?.published_at ?? new Date().toISOString()) : null,
    }

    let contentId = item?.id
    if (item) {
      await supabase.from('content_items').update(contentData).eq('id', item.id)
    } else {
      const { data, error: err } = await supabase.from('content_items').insert({ ...contentData, created_at: new Date().toISOString() }).select('id').single()
      if (err) { setError(err.message); setSaving(false); return }
      contentId = data?.id
    }

    if (contentId) {
      await supabase.from('media_assets').delete().eq('content_item_id', contentId)
      const assets: any[] = []
      const now = new Date().toISOString()

      if (form.youtube_video_id) {
        assets.push({ content_item_id: contentId, asset_type: 'video', youtube_video_id: form.youtube_video_id, url: null, created_at: now })
      } else if (form.video_url) {
        assets.push({ content_item_id: contentId, asset_type: 'video', url: form.video_url, youtube_video_id: null, created_at: now })
      }
      if (form.pdf_url) {
        assets.push({ content_item_id: contentId, asset_type: 'pdf', url: form.pdf_url, youtube_video_id: null, created_at: now })
      }
      if (form.audio_url) {
        assets.push({ content_item_id: contentId, asset_type: 'audio', url: form.audio_url, youtube_video_id: null, created_at: now })
      }
      if (form.page_content && form.content_type === 'pagina') {
        assets.push({ content_item_id: contentId, asset_type: 'page_content', url: form.page_content, youtube_video_id: null, created_at: now })
      }
      if (assets.length > 0) {
        await supabase.from('media_assets').insert(assets as any)
      }
    }

    router.push('/admin/conteudos')
    router.refresh()
  }

  const isVideo = form.content_type === 'video' || form.content_type === 'gravacao'
  const isAudio = form.content_type === 'audio' || form.content_type === 'podcast'
  const isPdf = form.content_type === 'pdf'
  const isPage = form.content_type === 'pagina'

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="label">Admin</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>
            {item ? 'Editar conteúdo' : 'Novo conteúdo'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Título + Slug */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">
            Título *
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }))} required />
          </label>
          <label className="field">
            Slug (URL) *
            <input type="text" value={form.slug} onChange={e => set('slug', generateSlug(e.target.value))} required />
          </label>
        </div>

        {/* Descrição */}
        <label className="field">
          Descrição
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrição curta do conteúdo..." />
        </label>

        {/* Tipo + Status + Visibilidade */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">
            Tipo de conteúdo *
            <select value={form.content_type} onChange={e => set('content_type', e.target.value)}>
              <option value="video">Vídeo (YouTube)</option>
              <option value="pdf">PDF / Ebook</option>
              <option value="audio">Áudio</option>
              <option value="podcast">Podcast</option>
              <option value="pagina">Artigo / Blog</option>
              <option value="gravacao">Gravação</option>
            </select>
          </label>
          <label className="field">
            Status
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </label>
          <label className="field">
            Visibilidade
            <select value={form.visibility} onChange={e => set('visibility', e.target.value)}>
              <option value="publico">Público</option>
              <option value="privado">Privado</option>
            </select>
          </label>
        </div>

        {/* VÍDEO */}
        {isVideo && (
          <div style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="label" style={{ marginBottom: 0 }}>Mídia — Vídeo</span>
            <label className="field">
              YouTube Video ID (não listado)
              <input type="text" value={form.youtube_video_id} onChange={e => set('youtube_video_id', e.target.value.trim())} placeholder="Ex: dQw4w9WgXcQ" />
              <small style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>Somente o ID do vídeo, não a URL completa. Use este campo OU o upload abaixo.</small>
            </label>
            <label className="field">
              URL do vídeo hospedado (mp4)
              <input type="url" value={form.video_url} onChange={e => set('video_url', e.target.value)} placeholder="https://... ou use o upload →" />
              <UploadButton
                bucket="media"
                folder="videos"
                accept="video/*"
                label="Upload de vídeo"
                onUrl={url => set('video_url', url)}
                currentUrl={form.video_url}
              />
            </label>
          </div>
        )}

        {/* PDF */}
        {isPdf && (
          <div style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="label" style={{ marginBottom: 0 }}>Mídia — PDF / Ebook</span>
            <label className="field">
              URL do PDF
              <input type="url" value={form.pdf_url} onChange={e => set('pdf_url', e.target.value)} placeholder="https://... ou use o upload →" />
              <UploadButton
                bucket="media"
                folder="pdfs"
                accept=".pdf,application/pdf"
                label="Upload de PDF"
                onUrl={url => set('pdf_url', url)}
                currentUrl={form.pdf_url}
              />
            </label>
          </div>
        )}

        {/* ÁUDIO / PODCAST */}
        {isAudio && (
          <div style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="label" style={{ marginBottom: 0 }}>Mídia — Áudio</span>
            <label className="field">
              URL do áudio
              <input type="url" value={form.audio_url} onChange={e => set('audio_url', e.target.value)} placeholder="https://... ou use o upload →" />
              <UploadButton
                bucket="media"
                folder="audios"
                accept="audio/*"
                label="Upload de áudio"
                onUrl={url => set('audio_url', url)}
                currentUrl={form.audio_url}
              />
            </label>
          </div>
        )}

        {/* ARTIGO / BLOG */}
        {isPage && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span className="label">Conteúdo do artigo</span>
            <ArticleEditor value={form.page_content} onChange={v => set('page_content', v)} />
          </div>
        )}

        {/* Thumbnails */}
        <div style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <span className="label" style={{ marginBottom: 0 }}>Imagens</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label className="field">
              Thumbnail URL
              <input type="url" value={form.thumbnail_url} onChange={e => set('thumbnail_url', e.target.value)} placeholder="https://..." />
              <UploadButton
                bucket="media"
                folder="thumbnails"
                accept="image/*"
                label="Upload de imagem"
                onUrl={url => set('thumbnail_url', url)}
                currentUrl={form.thumbnail_url}
              />
            </label>
            <label className="field">
              Poster URL (hero / fundo grande)
              <input type="url" value={form.poster_url} onChange={e => set('poster_url', e.target.value)} placeholder="https://..." />
              <UploadButton
                bucket="media"
                folder="thumbnails"
                accept="image/*"
                label="Upload de poster"
                onUrl={url => set('poster_url', url)}
                currentUrl={form.poster_url}
              />
            </label>
          </div>
        </div>

        {/* Categoria + Trilha + XP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">
            Categoria
            <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— Sem categoria —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </label>
          <label className="field">
            Trilha associada
            <select value={form.trail_id} onChange={e => set('trail_id', e.target.value)}>
              <option value="">— Sem trilha —</option>
              {trails.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </label>
          <label className="field">
            XP ao concluir
            <input type="number" min="0" value={form.xp_reward} onChange={e => set('xp_reward', Number(e.target.value))} />
          </label>
        </div>

        {/* Toggles */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'is_featured', label: 'Destaque (hero slideshow)' },
            { key: 'is_new', label: 'Marcar como Novo' },
            { key: 'requires_reflection', label: 'Reflexão obrigatória' },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
              <input
                type="checkbox"
                checked={(form as any)[key]}
                onChange={e => set(key, e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--red)' }}
              />
              {label}
            </label>
          ))}
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={14} />
            {saving ? 'Salvando...' : item ? 'Salvar alterações' : 'Publicar conteúdo'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
