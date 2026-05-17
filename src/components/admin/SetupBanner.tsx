'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

const STORAGE_KEY = 'otaku_setup_banner_dismissed'

export default function SetupBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  if (!visible) return null

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  return (
    <div style={{ background: 'rgba(200,144,26,0.07)', border: '1px solid rgba(200,144,26,0.25)', borderRadius: 'var(--r)', padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
      <AlertTriangle size={18} color="var(--gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--gold)', marginBottom: '0.5rem' }}>Configuração inicial do Supabase</strong>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '0.6rem' }}>
          Para uploads funcionarem (imagens, PDFs, áudios), crie um bucket público chamado{' '}
          <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: '3px' }}>media</code>{' '}
          no painel do Supabase → Storage → New Bucket. Marque "Public bucket".
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.7 }}>
          Para XP funcionar com acúmulo, o SQL já está no arquivo <code style={{ background: 'rgba(0,0,0,0.3)', padding: '0 4px', borderRadius: '3px' }}>supabase/schema.sql</code> — execute-o no SQL Editor do Supabase se ainda não fez isso.
        </p>
      </div>
      <button
        onClick={dismiss}
        title="Esconder aviso"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px', flexShrink: 0 }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
