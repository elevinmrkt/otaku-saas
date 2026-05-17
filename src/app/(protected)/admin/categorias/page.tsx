'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react'

interface Category {
  id: string
  title: string
  slug: string
  description: string | null
}

function generateSlug(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminCategorias() {
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ title: '', slug: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('title')
    setCategories(data ?? [])
    setLoading(false)
  }

  function startNew() {
    setForm({ title: '', slug: '', description: '' })
    setEditId(null)
    setShowNew(true)
    setError('')
  }

  function startEdit(cat: Category) {
    setForm({ title: cat.title, slug: cat.slug, description: cat.description ?? '' })
    setEditId(cat.id)
    setShowNew(true)
    setError('')
  }

  function cancelForm() {
    setShowNew(false)
    setEditId(null)
    setError('')
  }

  async function handleSave() {
    if (!form.title.trim()) { setError('Título é obrigatório.'); return }
    setSaving(true)
    setError('')
    const slug = form.slug || generateSlug(form.title)
    const payload = { title: form.title.trim(), slug, description: form.description.trim() || null }

    if (editId) {
      const { error: err } = await supabase.from('categories').update(payload).eq('id', editId)
      if (err) { setError(err.message); setSaving(false); return }
      setCategories(c => c.map(cat => cat.id === editId ? { ...cat, ...payload } : cat))
    } else {
      const { data, error: err } = await supabase.from('categories').insert(payload).select('*').single()
      if (err || !data) { setError(err?.message ?? 'Erro ao criar.'); setSaving(false); return }
      setCategories(c => [...c, data].sort((a, b) => a.title.localeCompare(b.title)))
    }
    setSaving(false)
    cancelForm()
  }

  async function handleDelete(cat: Category) {
    if (!confirm(`Excluir a categoria "${cat.title}"? Conteúdos ligados a ela perderão a categoria.`)) return
    await supabase.from('categories').delete().eq('id', cat.id)
    setCategories(c => c.filter(x => x.id !== cat.id))
  }

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <span className="label">Gestão</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '0.04em', color: 'var(--text)' }}>Categorias</h1>
        </div>
        {!showNew && (
          <button className="btn-primary" onClick={startNew}>
            <Plus size={14} />
            Nova categoria
          </button>
        )}
      </div>

      {/* Form */}
      {showNew && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <strong style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
              {editId ? 'Editar categoria' : 'Nova categoria'}
            </strong>
            <button onClick={cancelForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <label className="field">
                Título *
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }))}
                  placeholder="Ex: Estoicismo"
                  autoFocus
                />
              </label>
              <label className="field">
                Slug (URL)
                <input
                  type="text"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: generateSlug(e.target.value) }))}
                  placeholder="ex: estoicismo"
                />
              </label>
            </div>
            <label className="field">
              Descrição
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição curta (opcional)"
              />
            </label>
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Save size={14} />
                {saving ? 'Salvando...' : editId ? 'Salvar' : 'Criar'}
              </button>
              <button className="btn-ghost" onClick={cancelForm} type="button">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Carregando...</p>
      ) : categories.length === 0 ? (
        <div className="empty-state">
          <Tag size={32} />
          <p>Nenhuma categoria cadastrada.</p>
          <button className="btn-primary" onClick={startNew}><Plus size={14} />Criar primeira categoria</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {categories.map(cat => (
            <div
              key={cat.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', padding: '0.8rem 1.1rem',
              }}
            >
              <Tag size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{cat.title}</strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: '0.6rem' }}>/{cat.slug}</span>
                {cat.description && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cat.description}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <button className="btn-ghost sm" onClick={() => startEdit(cat)}>
                  <Edit2 size={12} /> Editar
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  style={{
                    background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
                    color: 'var(--muted)', padding: '0.3rem 0.6rem', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ff6b6b'; (e.currentTarget as HTMLElement).style.color = '#ff6b6b' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
