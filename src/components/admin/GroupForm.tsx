'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import UploadButton from '@/components/admin/UploadButton'

export default function GroupForm({ group }: { group?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: group?.title ?? '',
    description: group?.description ?? '',
    group_type: group?.group_type ?? 'whatsapp',
    whatsapp_url: group?.whatsapp_url ?? '',
    poster_url: group?.poster_url ?? '',
    rules: group?.rules ?? '',
    status: group?.status ?? 'ativo',
    visibility: group?.visibility ?? 'publico',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = { ...form, updated_at: new Date().toISOString() }
    if (group) { await supabase.from('community_groups').update(data).eq('id', group.id) }
    else { await supabase.from('community_groups').insert({ ...data, created_at: new Date().toISOString() }) }
    router.push('/admin/grupos')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{group ? 'Editar grupo' : 'Novo grupo'}</h1></div>
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label className="field">Nome *<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
        <label className="field">Descrição<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
          <label className="field">Tipo<select value={form.group_type} onChange={e => setForm(f => ({ ...f, group_type: e.target.value }))}><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option><option value="discord">Discord</option><option value="outro">Outro</option></select></label>
          <label className="field">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>
          <label className="field">Visibilidade<select value={form.visibility} onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}><option value="publico">Público</option><option value="privado">Privado</option></select></label>
        </div>
        <label className="field">Link do grupo<input type="url" value={form.whatsapp_url} onChange={e => setForm(f => ({ ...f, whatsapp_url: e.target.value }))} placeholder="https://chat.whatsapp.com/..." /></label>
        <label className="field">Imagem/pôster
          <input type="url" value={form.poster_url} onChange={e => setForm(f => ({ ...f, poster_url: e.target.value }))} placeholder="https://..." />
          <UploadButton bucket="media" folder="thumbnails" accept="image/*" label="Upload imagem" onUrl={url => setForm(f => ({ ...f, poster_url: url }))} currentUrl={form.poster_url} />
        </label>
        <label className="field">Regras do grupo<textarea value={form.rules} onChange={e => setForm(f => ({ ...f, rules: e.target.value }))} placeholder="Resumo das regras de convivência..." /></label>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={14} />{saving ? 'Salvando...' : group ? 'Salvar' : 'Criar grupo'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
