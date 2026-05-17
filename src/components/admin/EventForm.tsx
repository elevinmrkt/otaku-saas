'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'

export default function EventForm({ event }: { event?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    event_type: event?.event_type ?? 'aula',
    start_datetime: event?.start_datetime ? event.start_datetime.slice(0, 16) : '',
    end_datetime: event?.end_datetime ? event.end_datetime.slice(0, 16) : '',
    meeting_url: event?.meeting_url ?? '',
    status: event?.status ?? 'agendado',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      ...form,
      end_datetime: form.end_datetime || null,
      meeting_url: form.meeting_url || null,
      updated_at: new Date().toISOString(),
    }
    if (event) {
      await supabase.from('events').update(data).eq('id', event.id)
    } else {
      await supabase.from('events').insert({ ...data, created_at: new Date().toISOString() })
    }
    router.push('/admin/agenda')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{event ? 'Editar evento' : 'Novo evento'}</h1></div>
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="field">Título *<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
        <label className="field">Descrição<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Tipo
            <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}>
              <option value="aula">Aula</option>
              <option value="clube">Clube da leitura</option>
              <option value="desafio">Desafio</option>
              <option value="live">Live</option>
              <option value="encontro">Encontro</option>
              <option value="publicacao">Publicação</option>
            </select>
          </label>
          <label className="field">Status
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="agendado">Agendado</option>
              <option value="ao_vivo">Ao vivo</option>
              <option value="encerrado">Encerrado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Início *<input type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} required /></label>
          <label className="field">Fim<input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} /></label>
        </div>
        <label className="field">Link do evento<input type="url" value={form.meeting_url} onChange={e => setForm(f => ({ ...f, meeting_url: e.target.value }))} placeholder="https://meet.google.com/..." /></label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={14} />{saving ? 'Salvando...' : event ? 'Salvar' : 'Criar evento'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
