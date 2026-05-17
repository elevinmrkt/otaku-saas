'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { CheckCircle } from 'lucide-react'

export default function ProfileEditor({ profile }: { profile: User | null }) {
  const supabase = createClient()
  const [name, setName] = useState(profile?.name ?? '')
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').update({ name, nickname, phone, updated_at: new Date().toISOString() }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em', marginBottom: '1.25rem' }}>
        Editar perfil
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        <label className="field">
          Nome
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
        </label>
        <label className="field">
          Nick na Guilda
          <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Como te chamam" />
        </label>
        <label className="field">
          WhatsApp
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+55 11 9 0000-0000" />
        </label>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ justifyContent: 'center', marginTop: '0.25rem' }}
        >
          {saving ? 'Salvando...' : saved ? (
            <><CheckCircle size={14} /> Salvo!</>
          ) : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
