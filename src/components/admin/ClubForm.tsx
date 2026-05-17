'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'

export default function ClubForm({ cycle }: { cycle?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: cycle?.title ?? '',
    work_title: cycle?.work_title ?? '',
    work_author: cycle?.work_author ?? '',
    summary: cycle?.summary ?? '',
    theme: cycle?.theme ?? '',
    total_pages: cycle?.total_pages ?? '',
    current_page: cycle?.current_page ?? '0',
    cover_url: cycle?.cover_url ?? '',
    mockup_url: cycle?.mockup_url ?? '',
    start_date: cycle?.start_date ? cycle.start_date.split('T')[0] : '',
    meeting_date: cycle?.meeting_date ? cycle.meeting_date.split('T')[0] : '',
    meeting_link: cycle?.meeting_link ?? '',
    whatsapp_group_url: cycle?.whatsapp_group_url ?? '',
    status: cycle?.status ?? 'previsto',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, total_pages: form.total_pages ? Number(form.total_pages) : null, current_page: form.current_page ? Number(form.current_page) : null, updated_at: new Date().toISOString() }
    if (cycle) { await supabase.from('book_club_cycles').update(data).eq('id', cycle.id) }
    else { await supabase.from('book_club_cycles').insert({ ...data, created_at: new Date().toISOString() }) }
    router.push('/admin/clube')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{cycle ? 'Editar ciclo' : 'Novo ciclo'}</h1></div>
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="field">Nome do ciclo<input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Ciclo 01 — Vinland Saga" /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Obra *<input type="text" value={form.work_title} onChange={e => setForm(f => ({ ...f, work_title: e.target.value }))} required /></label>
          <label className="field">Autor<input type="text" value={form.work_author} onChange={e => setForm(f => ({ ...f, work_author: e.target.value }))} /></label>
        </div>
        <label className="field">Tema do ciclo<input type="text" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))} placeholder="Ex: Identidade e propósito" /></label>
        <label className="field">Resumo / descrição<textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">Total de páginas<input type="number" value={form.total_pages} onChange={e => setForm(f => ({ ...f, total_pages: e.target.value }))} /></label>
          <label className="field">Página atual<input type="number" value={form.current_page} onChange={e => setForm(f => ({ ...f, current_page: e.target.value }))} /></label>
          <label className="field">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="previsto">Previsto</option><option value="ativo">Ativo</option><option value="encerrado">Encerrado</option></select></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Capa URL<input type="url" value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} placeholder="https://..." /></label>
          <label className="field">Mockup URL<input type="url" value={form.mockup_url} onChange={e => setForm(f => ({ ...f, mockup_url: e.target.value }))} placeholder="https://..." /></label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Data de início<input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></label>
          <label className="field">Data do encontro<input type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} /></label>
        </div>
        <label className="field">Link do encontro (Meet, Zoom...)<input type="url" value={form.meeting_link} onChange={e => setForm(f => ({ ...f, meeting_link: e.target.value }))} placeholder="https://..." /></label>
        <label className="field">Link do grupo WhatsApp<input type="url" value={form.whatsapp_group_url} onChange={e => setForm(f => ({ ...f, whatsapp_group_url: e.target.value }))} placeholder="https://chat.whatsapp.com/..." /></label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={14} />{saving ? 'Salvando...' : cycle ? 'Salvar' : 'Criar ciclo'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
