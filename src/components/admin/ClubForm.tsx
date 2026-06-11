'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Plus, Trash2, FileText, Headphones, Video, Link as LinkIcon, BookOpen, Film } from 'lucide-react'
import UploadButton from '@/components/admin/UploadButton'

type Tab = 'info' | 'progresso' | 'encontro' | 'materiais'

interface WeeklyGoal {
  id?: string; week_number: number; title: string; page_start: number; page_end: number
  theme: string; description: string; guide_question: string
}
interface Material {
  id?: string; title: string; material_type: string; description: string
  url: string; thumbnail_url: string; visibility: string; order_index: number
  xp_reward: number; requires_reflection: boolean
}

const MATERIAL_TYPES = [
  { value: 'pdf', label: 'PDF', icon: <FileText size={14} /> },
  { value: 'video', label: 'Vídeo', icon: <Video size={14} /> },
  { value: 'audio', label: 'Áudio', icon: <Headphones size={14} /> },
  { value: 'podcast', label: 'Podcast', icon: <Headphones size={14} /> },
  { value: 'pagina', label: 'Artigo', icon: <BookOpen size={14} /> },
  { value: 'gravacao', label: 'Gravação', icon: <Film size={14} /> },
  { value: 'externo', label: 'Link externo', icon: <LinkIcon size={14} /> },
]

export default function ClubForm({ cycle }: { cycle?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<Tab>('info')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [form, setForm] = useState({
    // Tab 1 — Informações
    title: cycle?.title ?? '',
    work_title: cycle?.work_title ?? '',
    work_author: cycle?.work_author ?? '',
    theme: cycle?.theme ?? '',
    headline: cycle?.headline ?? '',
    objective: cycle?.objective ?? '',
    summary: cycle?.summary ?? '',
    status: cycle?.status ?? 'previsto',
    xp_reward: cycle?.xp_reward ?? 100,
    required_plan: cycle?.required_plan ?? 'mensal',
    start_date: cycle?.start_date ? cycle.start_date.split('T')[0] : '',
    end_date: cycle?.end_date ? cycle.end_date.split('T')[0] : '',
    whatsapp_group_url: cycle?.whatsapp_group_url ?? '',
    cover_url: cycle?.cover_url ?? '',
    mockup_url: cycle?.mockup_url ?? '',
    banner_url: cycle?.banner_url ?? '',
    // Tab 2 — Progresso
    total_pages: cycle?.total_pages ?? '',
    current_page: cycle?.current_page ?? '0',
    current_week: cycle?.current_week ?? '1',
    week_question: cycle?.week_question ?? '',
    // Tab 3 — Encontro
    meeting_date: cycle?.meeting_date ? cycle.meeting_date.split('T')[0] : '',
    meeting_link: cycle?.meeting_link ?? '',
    meeting_description: cycle?.meeting_description ?? '',
    meeting_recording_url: cycle?.meeting_recording_url ?? '',
  })

  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>(
    cycle?.weekly_goals ?? []
  )
  const [materials, setMaterials] = useState<Material[]>(
    cycle?.materials ?? []
  )

  // ── Weekly goals helpers
  function addGoal() {
    setWeeklyGoals(g => [...g, { week_number: g.length + 1, title: '', page_start: 0, page_end: 0, theme: '', description: '', guide_question: '' }])
  }
  function removeGoal(i: number) { setWeeklyGoals(g => g.filter((_, idx) => idx !== i)) }
  function updateGoal(i: number, field: keyof WeeklyGoal, value: string | number) {
    setWeeklyGoals(g => g.map((goal, idx) => idx === i ? { ...goal, [field]: value } : goal))
  }

  // ── Materials helpers
  function addMaterial() {
    setMaterials(m => [...m, { title: '', material_type: 'pdf', description: '', url: '', thumbnail_url: '', visibility: 'membros', order_index: m.length, xp_reward: 0, requires_reflection: false }])
  }
  function removeMaterial(i: number) { setMaterials(m => m.filter((_, idx) => idx !== i)) }
  function updateMaterial(i: number, field: keyof Material, value: string | number | boolean) {
    setMaterials(m => m.map((mat, idx) => idx === i ? { ...mat, [field]: value } : mat))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError('')

    const data = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      meeting_date: form.meeting_date || null,
      total_pages: form.total_pages ? Number(form.total_pages) : null,
      current_page: Number(form.current_page),
      current_week: Number(form.current_week),
      xp_reward: Number(form.xp_reward),
      updated_at: new Date().toISOString(),
    }

    let cycleId = cycle?.id

    if (cycle) {
      const { error } = await supabase.from('book_club_cycles').update(data).eq('id', cycle.id)
      if (error) {
        setSaveError('Erro ao salvar: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      const { data: created, error } = await supabase
        .from('book_club_cycles')
        .insert({ ...data, created_at: new Date().toISOString() })
        .select('id').single()
      if (error || !created) {
        setSaveError('Erro ao criar ciclo: ' + (error?.message ?? 'Tente novamente.'))
        setSaving(false)
        return
      }
      cycleId = created.id
    }

    if (cycleId) {
      await supabase.from('club_weekly_goals').delete().eq('cycle_id', cycleId)
      if (weeklyGoals.length > 0) {
        const { error } = await supabase.from('club_weekly_goals').insert(
          weeklyGoals.map(g => ({ ...g, cycle_id: cycleId, page_start: Number(g.page_start), page_end: Number(g.page_end), week_number: Number(g.week_number), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }))
        )
        if (error) {
          setSaveError('Ciclo salvo, mas erro nas metas semanais: ' + error.message)
          setSaving(false)
          return
        }
      }

      await supabase.from('club_cycle_materials').delete().eq('cycle_id', cycleId)
      if (materials.length > 0) {
        const { error } = await supabase.from('club_cycle_materials').insert(
          materials.map((m, i) => ({ ...m, cycle_id: cycleId, order_index: i, xp_reward: Number(m.xp_reward), created_at: new Date().toISOString() }))
        )
        if (error) {
          setSaveError('Ciclo salvo, mas erro nos materiais: ' + error.message)
          setSaving(false)
          return
        }
      }
    }

    router.push('/admin/clube')
    router.refresh()
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Informações' },
    { key: 'progresso', label: 'Progresso & Metas' },
    { key: 'encontro', label: 'Encontro' },
    { key: 'materiais', label: 'Materiais' },
  ]

  return (
    <div style={{ maxWidth: '860px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{cycle ? 'Editar ciclo' : 'Novo ciclo'}</h1></div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{
              padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: 600,
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === t.key ? 'var(--text)' : 'var(--muted)',
              borderBottom: activeTab === t.key ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 150ms',
            }}
          >{t.label}</button>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ─── Tab 1: Informações ─── */}
        {activeTab === 'info' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label className="field">Obra *<input value={form.work_title} onChange={e => setForm(f => ({ ...f, work_title: e.target.value }))} required /></label>
              <label className="field">Autor<input value={form.work_author} onChange={e => setForm(f => ({ ...f, work_author: e.target.value }))} /></label>
            </div>
            <label className="field">Nome do ciclo<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Ciclo 01 — Vinland Saga" /></label>
            <label className="field">Tema do ciclo<input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="Ex: Identidade e propósito" /></label>
            <label className="field">Frase de impacto (headline)<input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Frase curta e marcante" /></label>
            <label className="field">Objetivo do ciclo<textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} rows={2} /></label>
            <label className="field">Resumo da obra<textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} rows={4} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <label className="field">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="previsto">Previsto</option><option value="ativo">Ativo</option><option value="encerrado">Encerrado</option></select></label>
              <label className="field">Plano exigido<select value={form.required_plan} onChange={e => setForm(f => ({ ...f, required_plan: e.target.value }))}><option value="mensal">Mensal</option><option value="protagonista">Protagonista</option></select></label>
              <label className="field">XP ao concluir<input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label className="field">Início<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></label>
              <label className="field">Encerramento<input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></label>
            </div>
            <label className="field">Link do grupo WhatsApp<input type="url" value={form.whatsapp_group_url} onChange={e => setForm(f => ({ ...f, whatsapp_group_url: e.target.value }))} placeholder="https://chat.whatsapp.com/..." /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label className="field">Capa
                <input type="url" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." />
                <UploadButton bucket="media" folder="thumbnails" accept="image/*" label="Upload capa" onUrl={url => setForm(f => ({ ...f, cover_url: url }))} currentUrl={form.cover_url} />
              </label>
              <label className="field">Mockup 3D
                <input type="url" value={form.mockup_url} onChange={e => setForm(f => ({ ...f, mockup_url: e.target.value }))} placeholder="https://..." />
                <UploadButton bucket="media" folder="thumbnails" accept="image/*" label="Upload mockup" onUrl={url => setForm(f => ({ ...f, mockup_url: url }))} currentUrl={form.mockup_url} />
              </label>
            </div>
            <label className="field">Banner / Hero da página
              <input type="url" value={form.banner_url} onChange={e => setForm(f => ({ ...f, banner_url: e.target.value }))} placeholder="https://... (imagem larga para o fundo do hero)" />
              <UploadButton bucket="media" folder="thumbnails" accept="image/*" label="Upload banner" onUrl={url => setForm(f => ({ ...f, banner_url: url }))} currentUrl={form.banner_url} />
            </label>
          </>
        )}

        {/* ─── Tab 2: Progresso & Metas ─── */}
        {activeTab === 'progresso' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <label className="field">Total de páginas<input type="number" value={form.total_pages} onChange={e => setForm(f => ({ ...f, total_pages: e.target.value }))} /></label>
              <label className="field">Página atual da comunidade<input type="number" value={form.current_page} onChange={e => setForm(f => ({ ...f, current_page: e.target.value }))} /></label>
              <label className="field">Semana ativa<input type="number" min="1" value={form.current_week} onChange={e => setForm(f => ({ ...f, current_week: e.target.value }))} /></label>
            </div>
            <label className="field">Pergunta da semana<textarea value={form.week_question} onChange={e => setForm(f => ({ ...f, week_question: e.target.value }))} rows={2} placeholder="Ex: O que motivou Erik a abandonar tudo que conhecia?" /></label>

            {/* Metas semanais */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Metas semanais</h3>
                <button type="button" className="btn-ghost sm" onClick={addGoal}><Plus size={13} />Adicionar semana</button>
              </div>
              {weeklyGoals.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '1rem 0' }}>Nenhuma meta criada. Clique em "Adicionar semana" para começar.</p>
              )}
              {weeklyGoals.map((goal, i) => (
                <div key={i} style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <strong style={{ fontSize: '0.88rem' }}>Semana {goal.week_number}</strong>
                    <button type="button" onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', display: 'flex' }}><Trash2 size={15} /></button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label className="field" style={{ margin: 0 }}>Nº semana<input type="number" min="1" value={goal.week_number} onChange={e => updateGoal(i, 'week_number', Number(e.target.value))} /></label>
                    <label className="field" style={{ margin: 0 }}>Pág. início<input type="number" min="0" value={goal.page_start} onChange={e => updateGoal(i, 'page_start', Number(e.target.value))} /></label>
                    <label className="field" style={{ margin: 0 }}>Pág. fim<input type="number" min="0" value={goal.page_end} onChange={e => updateGoal(i, 'page_end', Number(e.target.value))} /></label>
                  </div>
                  <label className="field" style={{ margin: 0, marginBottom: '0.5rem' }}>Título da semana<input value={goal.title} onChange={e => updateGoal(i, 'title', e.target.value)} placeholder="Ex: A decisão de Erik" /></label>
                  <label className="field" style={{ margin: 0, marginBottom: '0.5rem' }}>Tema<input value={goal.theme} onChange={e => updateGoal(i, 'theme', e.target.value)} placeholder="Ex: Ruptura e identidade" /></label>
                  <label className="field" style={{ margin: 0, marginBottom: '0.5rem' }}>Descrição<textarea value={goal.description} onChange={e => updateGoal(i, 'description', e.target.value)} rows={2} /></label>
                  <label className="field" style={{ margin: 0 }}>Pergunta-guia<input value={goal.guide_question} onChange={e => updateGoal(i, 'guide_question', e.target.value)} placeholder="Ex: O que define um propósito verdadeiro?" /></label>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── Tab 3: Encontro ─── */}
        {activeTab === 'encontro' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label className="field">Data do encontro<input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} /></label>
              <label className="field">Link da call<input type="url" value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." /></label>
            </div>
            <label className="field">Descrição do encontro<textarea value={form.meeting_description} onChange={e => setForm(f => ({ ...f, meeting_description: e.target.value }))} rows={3} placeholder="O que será discutido, quem pode participar, como funciona..." /></label>
            <label className="field">Link da gravação (pós encontro)<input type="url" value={form.meeting_recording_url} onChange={e => setForm(f => ({ ...f, meeting_recording_url: e.target.value }))} placeholder="https://youtube.com/... ou link do drive" /></label>
            {form.meeting_recording_url && (
              <div style={{ padding: '0.75rem', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)', borderRadius: 'var(--r)', fontSize: '0.82rem', color: 'var(--green)' }}>
                ✓ Gravação configurada — será exibida para os membros após o encontro.
              </div>
            )}
          </>
        )}

        {/* ─── Tab 4: Materiais ─── */}
        {activeTab === 'materiais' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>PDFs, guias, áudios, vídeos e links relevantes para o ciclo.</p>
              <button type="button" className="btn-ghost sm" onClick={addMaterial}><Plus size={13} />Adicionar material</button>
            </div>
            {materials.length === 0 && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', padding: '1rem 0' }}>Nenhum material adicionado.</p>
            )}
            {materials.map((mat, i) => (
              <div key={i} style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {MATERIAL_TYPES.map(t => (
                      <button
                        key={t.value} type="button"
                        onClick={() => updateMaterial(i, 'material_type', t.value)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.3rem',
                          padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem',
                          fontWeight: 600, cursor: 'pointer',
                          background: mat.material_type === t.value ? 'rgba(200,144,26,0.15)' : 'var(--card)',
                          border: `1px solid ${mat.material_type === t.value ? 'var(--gold)' : 'var(--border)'}`,
                          color: mat.material_type === t.value ? 'var(--gold)' : 'var(--muted)',
                        }}
                      >{t.icon}{t.label}</button>
                    ))}
                  </div>
                  <button type="button" onClick={() => removeMaterial(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', display: 'flex', flexShrink: 0 }}><Trash2 size={15} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <label className="field" style={{ margin: 0 }}>Título *<input value={mat.title} onChange={e => updateMaterial(i, 'title', e.target.value)} required={activeTab === 'materiais'} /></label>
                  <label className="field" style={{ margin: 0 }}>URL / Link<input type="url" value={mat.url} onChange={e => updateMaterial(i, 'url', e.target.value)} placeholder="https://..." /></label>
                </div>
                <label className="field" style={{ margin: 0, marginBottom: '0.5rem' }}>Descrição<input value={mat.description} onChange={e => updateMaterial(i, 'description', e.target.value)} /></label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label className="field" style={{ margin: 0, flex: 1, minWidth: '120px' }}>XP<input type="number" min="0" value={mat.xp_reward} onChange={e => updateMaterial(i, 'xp_reward', Number(e.target.value))} /></label>
                  <label className="field" style={{ margin: 0, flex: 1, minWidth: '120px' }}>Visibilidade<select value={mat.visibility} onChange={e => updateMaterial(i, 'visibility', e.target.value)}><option value="membros">Membros</option><option value="publico">Público</option></select></label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.83rem', color: 'var(--muted)', cursor: 'pointer', marginTop: '0.5rem' }}>
                    <input type="checkbox" checked={mat.requires_reflection} onChange={e => updateMaterial(i, 'requires_reflection', e.target.checked)} />
                    Exige reflexão
                  </label>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ─── Erro de salvamento ─── */}
        {saveError && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(229,9,20,0.08)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: 'var(--r)', fontSize: '0.85rem', color: '#ff6b6b' }}>
            {saveError}
          </div>
        )}

        {/* ─── Botões de ação ─── */}
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={14} />{saving ? 'Salvando...' : cycle ? 'Salvar ciclo' : 'Criar ciclo'}
          </button>
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            {tabs.map((t, idx) => {
              const currentIdx = tabs.findIndex(x => x.key === activeTab)
              if (idx === currentIdx - 1) return <button key={t.key} type="button" className="btn-ghost sm" onClick={() => setActiveTab(t.key)}>← {t.label}</button>
              if (idx === currentIdx + 1) return <button key={t.key} type="button" className="btn-ghost sm" onClick={() => setActiveTab(t.key)}>{t.label} →</button>
              return null
            })}
          </div>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
