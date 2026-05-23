'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react'
import UploadButton from '@/components/admin/UploadButton'

interface Task { id?: string; day_number: number; title: string; description: string; reflection_prompt: string; xp_reward: number }

export default function ChallengeAdminForm({ challenge }: { challenge?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: challenge?.title ?? '',
    slug: challenge?.slug ?? '',
    headline: challenge?.headline ?? '',
    description: challenge?.description ?? '',
    objective: challenge?.objective ?? '',
    duration_days: challenge?.duration_days ?? 7,
    start_date: challenge?.start_date ? challenge.start_date.split('T')[0] : '',
    end_date: challenge?.end_date ? challenge.end_date.split('T')[0] : '',
    meeting_date: challenge?.meeting_date ? challenge.meeting_date.split('T')[0] : '',
    meeting_link: challenge?.meeting_link ?? '',
    whatsapp_group_url: challenge?.whatsapp_group_url ?? '',
    poster_url: challenge?.poster_url ?? '',
    status: challenge?.status ?? 'previsto',
    xp_reward: challenge?.xp_reward ?? 100,
  })
  const [tasks, setTasks] = useState<Task[]>(challenge?.tasks ?? [])
  const [saving, setSaving] = useState(false)

  function generateSlug(t: string) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }
  function addTask() { setTasks(t => [...t, { day_number: t.length + 1, title: '', description: '', reflection_prompt: '', xp_reward: 10 }]) }
  function removeTask(i: number) { setTasks(t => t.filter((_, idx) => idx !== i)) }
  function updateTask(i: number, field: keyof Task, value: string | number) { setTasks(t => t.map((task, idx) => idx === i ? { ...task, [field]: value } : task)) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, duration_days: Number(form.duration_days), xp_reward: Number(form.xp_reward), updated_at: new Date().toISOString() }
    let challengeId = challenge?.id
    if (challenge) { await supabase.from('challenges').update(data).eq('id', challenge.id) }
    else {
      const { data: created } = await supabase.from('challenges').insert({ ...data, created_at: new Date().toISOString() }).select('id').single()
      challengeId = created?.id
    }
    if (challengeId) {
      await supabase.from('challenge_tasks').delete().eq('challenge_id', challengeId)
      if (tasks.length > 0) {
        await supabase.from('challenge_tasks').insert(tasks.map(t => ({ ...t, challenge_id: challengeId, xp_reward: Number(t.xp_reward), created_at: new Date().toISOString(), updated_at: new Date().toISOString() })))
      }
    }
    router.push('/admin/desafio')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{challenge ? 'Editar desafio' : 'Novo desafio'}</h1></div>
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Título *<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: f.slug || generateSlug(e.target.value) }))} required /></label>
          <label className="field">Slug *<input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: generateSlug(e.target.value) }))} required /></label>
        </div>
        <label className="field">Headline<input value={form.headline} onChange={e => setForm(f => ({ ...f, headline: e.target.value }))} placeholder="Frase de impacto" /></label>
        <label className="field">Descrição<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
        <label className="field">Objetivo<textarea value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">Duração (dias)<input type="number" min="1" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: Number(e.target.value) }))} /></label>
          <label className="field">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="previsto">Previsto</option><option value="ativo">Ativo</option><option value="encerrado">Encerrado</option></select></label>
          <label className="field">XP ao concluir<input type="number" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">Data de início<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></label>
          <label className="field">Data de fim<input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></label>
          <label className="field">Data da call<input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Link da call<input type="url" value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://..." /></label>
          <label className="field">Link do grupo WhatsApp<input type="url" value={form.whatsapp_group_url} onChange={e => setForm(f => ({ ...f, whatsapp_group_url: e.target.value }))} placeholder="https://chat.whatsapp.com/..." /></label>
        </div>
        <label className="field">Pôster
          <input type="url" value={form.poster_url} onChange={e => setForm(f => ({ ...f, poster_url: e.target.value }))} placeholder="https://..." />
          <UploadButton bucket="media" folder="thumbnails" accept="image/*" label="Upload pôster" onUrl={url => setForm(f => ({ ...f, poster_url: url }))} currentUrl={form.poster_url} />
        </label>

        {/* Tasks */}
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em' }}>Missões diárias</h3>
            <button type="button" className="btn-ghost sm" onClick={addTask}><Plus size={13} />Adicionar</button>
          </div>
          {tasks.map((task, i) => (
            <div key={i} style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.75rem', alignItems: 'flex-start' }}>
                <label className="field" style={{ width: '60px' }}>Dia<input type="number" min="1" value={task.day_number} onChange={e => updateTask(i, 'day_number', Number(e.target.value))} /></label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="field">Título<input value={task.title} onChange={e => updateTask(i, 'title', e.target.value)} /></label>
                  <label className="field">Descrição<input value={task.description} onChange={e => updateTask(i, 'description', e.target.value)} /></label>
                  <label className="field">Prompt de reflexão<input value={task.reflection_prompt} onChange={e => updateTask(i, 'reflection_prompt', e.target.value)} placeholder="O que você aprendeu hoje?" /></label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <label className="field" style={{ width: '70px' }}>XP<input type="number" min="0" value={task.xp_reward} onChange={e => updateTask(i, 'xp_reward', Number(e.target.value))} /></label>
                  <button type="button" onClick={() => removeTask(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', display: 'flex' }}><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={14} />{saving ? 'Salvando...' : challenge ? 'Salvar' : 'Criar desafio'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
