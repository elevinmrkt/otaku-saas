'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/database'
import { CheckCircle, Camera } from 'lucide-react'

export default function ProfileEditor({ profile }: { profile: User | null }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile?.name ?? '')
  const [nickname, setNickname] = useState(profile?.nickname ?? '')
  const [phone, setPhone] = useState(profile?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url ?? null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const displayChar = (nickname || name || 'R').charAt(0).toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const objectUrl = URL.createObjectURL(file)
    setAvatarPreview(objectUrl)
    setUploadingAvatar(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploadingAvatar(false); return }

    // Exclui avatar antigo do Storage se existir
    const oldUrl = profile?.avatar_url ?? ''
    if (oldUrl.includes('/storage/v1/object/public/media/')) {
      const oldPath = oldUrl.split('/storage/v1/object/public/media/')[1]
      if (oldPath) await supabase.storage.from('media').remove([oldPath])
    }

    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(path, file, { upsert: true, contentType: file.type })

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      await supabase.from('users').update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      setAvatarPreview(publicUrl)
      router.refresh()
    }

    setUploadingAvatar(false)
    URL.revokeObjectURL(objectUrl)
    // Limpa o input para permitir re-upload do mesmo arquivo
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').update({ name, nickname, phone, updated_at: new Date().toISOString() }).eq('id', user.id)
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '1.5rem' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.03em', marginBottom: '1.25rem' }}>
        Editar perfil
      </h2>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploadingAvatar}
          style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }}
          title="Alterar foto"
        >
          <div style={{
            width: '64px', height: '64px', borderRadius: '14px',
            background: 'var(--red)', overflow: 'hidden', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'white',
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : displayChar}
          </div>
          {!uploadingAvatar && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '14px',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={18} color="white" />
            </div>
          )}
        </button>
        <div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'block', marginBottom: '0.2rem' }}
          >
            {uploadingAvatar ? 'Enviando...' : 'Alterar foto de perfil'}
          </button>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            JPG, PNG ou WEBP. A foto anterior é excluída automaticamente.
          </span>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleAvatarChange}
        />
      </div>

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
          {saving ? 'Salvando...' : saved ? <><CheckCircle size={14} /> Salvo!</> : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
