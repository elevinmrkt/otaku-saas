'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save } from 'lucide-react'
import UploadButton from '@/components/admin/UploadButton'

export default function BadgeForm({ badge }: { badge?: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [form, setForm] = useState({
    title: badge?.title ?? '',
    description: badge?.description ?? '',
    icon_url: badge?.icon_url ?? '',
    rule_type: badge?.rule_type ?? 'manual',
    xp_reward: badge?.xp_reward ?? 0,
  })
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const data = {
      ...form,
      xp_reward: Number(form.xp_reward),
      updated_at: new Date().toISOString(),
    }
    if (badge) {
      await supabase.from('badges').update(data).eq('id', badge.id)
    } else {
      await supabase.from('badges').insert({ ...data, created_at: new Date().toISOString() })
    }
    router.push('/admin/gamificacao?tab=badges')
    router.refresh()
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div><span className="label">Admin</span><h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', letterSpacing: '0.04em' }}>{badge ? 'Editar conquista' : 'Nova conquista'}</h1></div>
      </div>
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Título *<input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></label>
          <label className="field">Ícone (emoji ou URL)
            <input value={form.icon_url} onChange={e => setForm(f => ({ ...f, icon_url: e.target.value }))} placeholder="🏅 ou https://..." />
            <UploadButton bucket="media" folder="thumbnails" accept="image/*" label="Upload ícone" onUrl={url => setForm(f => ({ ...f, icon_url: url }))} currentUrl={form.icon_url} />
          </label>
        </div>
        <label className="field">Descrição<textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field">Tipo de regra
            <select value={form.rule_type} onChange={e => setForm(f => ({ ...f, rule_type: e.target.value }))}>
              <option value="manual">Manual</option>
              <option value="automatico">Automático</option>
            </select>
          </label>
          <label className="field">XP concedido ao ganhar<input type="number" min="0" value={form.xp_reward} onChange={e => setForm(f => ({ ...f, xp_reward: Number(e.target.value) }))} /></label>
        </div>
        {form.rule_type === 'manual' && (
          <div style={{ background: 'var(--card-2)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
            Conquistas manuais são concedidas pelo admin diretamente via painel de membros.
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-primary" type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Save size={14} />{saving ? 'Salvando...' : badge ? 'Salvar' : 'Criar conquista'}</button>
          <button type="button" className="btn-ghost" onClick={() => router.back()}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
