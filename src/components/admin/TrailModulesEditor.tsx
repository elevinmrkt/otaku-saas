'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Search, ChevronUp, ChevronDown, X, GripVertical } from 'lucide-react'

interface ContentItem {
  id: string
  title: string
  content_type: string
  thumbnail_url: string | null
  status: string
}

interface ModuleContent {
  id: string
  content_item_id: string
  order_index: number
  content_items: ContentItem
}

interface TrailModule {
  id: string
  title: string
  order_index: number
  trail_module_contents: ModuleContent[]
}

interface Props {
  trailId: string
  initialModules: TrailModule[]
  allContent: ContentItem[]
}

const TYPE_COLOR: Record<string, string> = {
  video: 'rgba(229,9,20,0.15)',
  pdf: 'rgba(200,144,26,0.15)',
  audio: 'rgba(37,211,102,0.15)',
  podcast: 'rgba(37,211,102,0.15)',
  pagina: 'rgba(100,149,237,0.15)',
  gravacao: 'rgba(229,9,20,0.1)',
}

export default function TrailModulesEditor({ trailId, initialModules, allContent }: Props) {
  const supabase = createClient()
  const [modules, setModules] = useState<TrailModule[]>(
    [...initialModules].sort((a, b) => a.order_index - b.order_index)
  )
  const [search, setSearch] = useState<Record<string, string>>({})
  const [addingModule, setAddingModule] = useState(false)

  async function addModule() {
    setAddingModule(true)
    const title = `Módulo ${modules.length + 1}`
    const { data, error } = await supabase
      .from('trail_modules')
      .insert({ trail_id: trailId, title, order_index: modules.length, created_at: new Date().toISOString() })
      .select('id, title, order_index')
      .single()
    setAddingModule(false)
    if (error || !data) { alert('Erro ao criar módulo: ' + error?.message); return }
    setModules(m => [...m, { id: data.id, title: data.title, order_index: data.order_index, trail_module_contents: [] }])
  }

  async function updateTitle(moduleId: string, title: string) {
    setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, title } : mod))
    await supabase.from('trail_modules').update({ title }).eq('id', moduleId)
  }

  async function deleteModule(moduleId: string) {
    if (!confirm('Excluir este módulo e remover todos os conteúdos dele?')) return
    await supabase.from('trail_module_contents').delete().eq('trail_module_id', moduleId)
    await supabase.from('trail_modules').delete().eq('id', moduleId)
    setModules(m => m.filter(mod => mod.id !== moduleId).map((mod, i) => ({ ...mod, order_index: i })))
  }

  async function moveModule(index: number, dir: -1 | 1) {
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= modules.length) return
    const next = [...modules]
    const a = next[index]
    const b = next[newIndex]
    next[index] = { ...b, order_index: index }
    next[newIndex] = { ...a, order_index: newIndex }
    setModules(next)
    await Promise.all([
      supabase.from('trail_modules').update({ order_index: newIndex }).eq('id', a.id),
      supabase.from('trail_modules').update({ order_index: index }).eq('id', b.id),
    ])
  }

  async function addContent(moduleId: string, item: ContentItem) {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    if (mod.trail_module_contents.some(mc => mc.content_item_id === item.id)) return
    const order = mod.trail_module_contents.length
    const { data, error } = await supabase
      .from('trail_module_contents')
      .insert({ trail_module_id: moduleId, content_item_id: item.id, order_index: order, created_at: new Date().toISOString() })
      .select('id, content_item_id, order_index')
      .single()
    if (error || !data) { alert('Erro ao adicionar: ' + error?.message); return }
    setModules(m => m.map(mod => mod.id === moduleId ? {
      ...mod,
      trail_module_contents: [...mod.trail_module_contents, { id: data.id, content_item_id: data.content_item_id, order_index: data.order_index, content_items: item }],
    } : mod))
    setSearch(s => ({ ...s, [moduleId]: '' }))
  }

  async function removeContent(moduleId: string, mcId: string) {
    await supabase.from('trail_module_contents').delete().eq('id', mcId)
    setModules(m => m.map(mod => mod.id === moduleId ? {
      ...mod,
      trail_module_contents: mod.trail_module_contents
        .filter(mc => mc.id !== mcId)
        .map((mc, i) => ({ ...mc, order_index: i })),
    } : mod))
  }

  async function moveContent(moduleId: string, index: number, dir: -1 | 1) {
    const mod = modules.find(m => m.id === moduleId)
    if (!mod) return
    const newIndex = index + dir
    if (newIndex < 0 || newIndex >= mod.trail_module_contents.length) return
    const items = [...mod.trail_module_contents].sort((a, b) => a.order_index - b.order_index)
    const a = items[index]
    const b = items[newIndex]
    items[index] = { ...b, order_index: index }
    items[newIndex] = { ...a, order_index: newIndex }
    setModules(m => m.map(mod => mod.id === moduleId ? { ...mod, trail_module_contents: items } : mod))
    await Promise.all([
      supabase.from('trail_module_contents').update({ order_index: newIndex }).eq('id', a.id),
      supabase.from('trail_module_contents').update({ order_index: index }).eq('id', b.id),
    ])
  }

  return (
    <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
        <div>
          <span className="label">Estrutura do conteúdo</span>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
            Módulos e aulas
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.3rem' }}>
            Organize a trilha em módulos e adicione os conteúdos em cada um.
          </p>
        </div>
        <button type="button" className="btn-primary sm" onClick={addModule} disabled={addingModule}>
          <Plus size={13} />
          {addingModule ? 'Criando...' : 'Novo módulo'}
        </button>
      </div>

      {modules.length === 0 && (
        <div className="empty-state">
          <GripVertical size={32} />
          <p>Nenhum módulo ainda.</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Clique em "Novo módulo" para começar a estruturar a trilha.</p>
          <button type="button" className="btn-primary" onClick={addModule}>
            <Plus size={14} /> Criar primeiro módulo
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modules.map((mod, modIndex) => {
          const q = search[mod.id] ?? ''
          const suggestions = q.length >= 1
            ? allContent.filter(c =>
                c.title.toLowerCase().includes(q.toLowerCase()) &&
                !mod.trail_module_contents.some(mc => mc.content_item_id === c.id)
              ).slice(0, 8)
            : []
          const sortedContents = [...mod.trail_module_contents].sort((a, b) => a.order_index - b.order_index)

          return (
            <div
              key={mod.id}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r)', overflow: 'hidden',
              }}
            >
              {/* Module header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.85rem 1.25rem',
                background: 'var(--card-2)', borderBottom: '1px solid var(--border)',
              }}>
                {/* Order arrows */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button type="button" onClick={() => moveModule(modIndex, -1)} disabled={modIndex === 0}
                    style={{ background: 'none', border: 'none', cursor: modIndex === 0 ? 'default' : 'pointer', color: modIndex === 0 ? 'var(--subtle)' : 'var(--muted)', padding: '1px', lineHeight: 1 }}>
                    <ChevronUp size={13} />
                  </button>
                  <button type="button" onClick={() => moveModule(modIndex, 1)} disabled={modIndex === modules.length - 1}
                    style={{ background: 'none', border: 'none', cursor: modIndex === modules.length - 1 ? 'default' : 'pointer', color: modIndex === modules.length - 1 ? 'var(--subtle)' : 'var(--muted)', padding: '1px', lineHeight: 1 }}>
                    <ChevronDown size={13} />
                  </button>
                </div>

                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.1em', flexShrink: 0 }}>
                  {String(modIndex + 1).padStart(2, '0')}
                </span>

                <input
                  type="text"
                  value={mod.title}
                  onChange={e => setModules(m => m.map(x => x.id === mod.id ? { ...x, title: e.target.value } : x))}
                  onBlur={e => updateTitle(mod.id, e.target.value)}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)',
                  }}
                />

                <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>
                  {sortedContents.length} conteúdo{sortedContents.length !== 1 ? 's' : ''}
                </span>

                <button type="button" onClick={() => deleteModule(mod.id)}
                  title="Excluir módulo"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem', flexShrink: 0, transition: 'color 150ms' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Content list */}
              <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
                {sortedContents.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', padding: '0.5rem 0 0.75rem', fontStyle: 'italic' }}>
                    Nenhum conteúdo. Use o campo de busca abaixo para adicionar.
                  </p>
                )}

                {sortedContents.map((mc, ci) => (
                  <div key={mc.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    padding: '0.5rem 0',
                    borderBottom: ci < sortedContents.length - 1 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button type="button" onClick={() => moveContent(mod.id, ci, -1)} disabled={ci === 0}
                        style={{ background: 'none', border: 'none', cursor: ci === 0 ? 'default' : 'pointer', color: ci === 0 ? 'var(--subtle)' : 'var(--muted)', padding: '1px', lineHeight: 1 }}>
                        <ChevronUp size={11} />
                      </button>
                      <button type="button" onClick={() => moveContent(mod.id, ci, 1)} disabled={ci === sortedContents.length - 1}
                        style={{ background: 'none', border: 'none', cursor: ci === sortedContents.length - 1 ? 'default' : 'pointer', color: ci === sortedContents.length - 1 ? 'var(--subtle)' : 'var(--muted)', padding: '1px', lineHeight: 1 }}>
                        <ChevronDown size={11} />
                      </button>
                    </div>

                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--muted)', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                      {ci + 1}
                    </span>

                    {mc.content_items?.thumbnail_url ? (
                      <img src={mc.content_items.thumbnail_url} alt="" style={{ width: '44px', height: '30px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '44px', height: '30px', background: TYPE_COLOR[mc.content_items?.content_type] ?? 'var(--card-2)', borderRadius: '4px', flexShrink: 0 }} />
                    )}

                    <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text)', fontWeight: 600, lineHeight: 1.3 }}>
                      {mc.content_items?.title}
                    </span>

                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
                      color: 'var(--muted)', background: TYPE_COLOR[mc.content_items?.content_type] ?? 'var(--card-2)',
                      padding: '0.15rem 0.45rem', borderRadius: '4px', flexShrink: 0,
                    }}>
                      {mc.content_items?.content_type}
                    </span>

                    <button type="button" onClick={() => removeContent(mod.id, mc.id)}
                      title="Remover da trilha"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '0.25rem', flexShrink: 0, transition: 'color 150ms' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ff6b6b')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Search to add content */}
                <div style={{ marginTop: '0.75rem', position: 'relative', width: '100%' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    background: 'var(--bg-2)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '0.4rem 0.85rem',
                    transition: 'border-color 150ms', width: '100%', boxSizing: 'border-box',
                  }}>
                    <Search size={13} color="var(--muted)" style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      value={q}
                      onChange={e => setSearch(s => ({ ...s, [mod.id]: e.target.value }))}
                      placeholder="Buscar conteúdo para adicionar..."
                      style={{
                        background: 'none', border: 'none', outline: 'none',
                        fontSize: '0.82rem', color: 'var(--text)', flex: 1,
                      }}
                    />
                    {q && (
                      <button type="button" onClick={() => setSearch(s => ({ ...s, [mod.id]: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 0, lineHeight: 1 }}>
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                      background: 'var(--card)', border: '1px solid var(--border-2)',
                      borderRadius: '10px', zIndex: 20,
                      boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                      overflow: 'hidden',
                    }}>
                      {suggestions.map((item, i) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addContent(mod.id, item)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            width: '100%', padding: '0.65rem 1rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
                            textAlign: 'left', transition: 'background 120ms',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt="" style={{ width: '40px', height: '27px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '40px', height: '27px', background: TYPE_COLOR[item.content_type] ?? 'var(--card-2)', borderRadius: '3px', flexShrink: 0 }} />
                          )}
                          <span style={{ flex: 1, fontSize: '0.83rem', color: 'var(--text)', fontWeight: 600 }}>{item.title}</span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase',
                            color: 'var(--muted)', background: TYPE_COLOR[item.content_type] ?? 'var(--card-2)',
                            padding: '0.15rem 0.4rem', borderRadius: '4px', flexShrink: 0,
                          }}>
                            {item.content_type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {q.length >= 1 && suggestions.length === 0 && (
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.75rem 1rem', zIndex: 20 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>
                        Nenhum conteúdo encontrado para "{q}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
