'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import UploadButton from './UploadButton'

export default function TrailForm({ trail }: { trail?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: trail?.title ?? '',
    slug: trail?.slug ?? '',
    description: trail?.description ?? '',
    thumbnail_url: trail?.thumbnail_url ?? '',
    poster_url: trail?.poster_url ?? '',
    status: trail?.status ?? 'rascunho',
    required_plan: trail?.required_plan ?? 'mensal',
    order_index: trail?.order_index ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function generateSlug(t: string) {
    return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.slug) { setError('Título e slug são obrigatórios.'); return }
    setSaving(true)
    const data = { ...form, order_index: Number(form.order_index), updated_at: new Date().toISOString() }
    if (trail) {
      const { error: err } = await supabase.from('trails').update(data).eq('id', trail.id)
      if (err) { setError(err.message); setSaving(false); return }
      router.push('/admin/trilhas')
      router.refresh()
    } else {
      const { data: newTrail, error: err } = await supabase
        .from('trails')
        .insert({ ...data, created_at: new Date().toISOString() })
        .select('id')
        .single()
      if (err || !newTrail) { setError(err?.message ?? 'Erro ao criar trilha.'); setSaving(false); return }
      router.push(`/admin/trilhas?acao=editar&id=${newTrail.id}`)
    }
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="label">Admin</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>
            {trail ? 'Editar trilha' : 'Nova trilha'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        <label className="field">
          Descrição
          <textarea value={form.description} onChange={e => set('description', e.target.value)} />
        </label>

        {/* Imagens */}
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
                label="Upload de thumbnail"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">
            Status
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="rascunho">Rascunho</option>
              <option value="publicado">Publicado</option>
              <option value="arquivado">Arquivado</option>
            </select>
          </label>
          <label className="field">
            Plano exigido
            <select value={form.required_plan} onChange={e => set('required_plan', e.target.value)}>
              <option value="mensal">Plano Mensal</option>
              <option value="protagonista">Plano Protagonista</option>
            </select>
          </label>
          <label className="field">
            Ordem de exibição
            <input type="number" min="0" value={form.order_index} onChange={e => set('order_index', Number(e.target.value))} />
          </label>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={14} />
            {saving ? 'Salvando...' : trail ? 'Salvar' : 'Criar trilha'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
