'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { UserRole, UserStatus } from '@/types/database'

interface Props {
  memberId: string
  currentStatus: UserStatus
  currentRole: UserRole
}

export default function MemberActions({ memberId, currentStatus, currentRole }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: UserStatus) {
    setLoading(true)
    await supabase.from('users').update({ status, updated_at: new Date().toISOString() }).eq('id', memberId)
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  async function updateRole(role: UserRole) {
    setLoading(true)
    await supabase.from('users').update({ role, updated_at: new Date().toISOString() }).eq('id', memberId)
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        className="btn-ghost sm"
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        style={{ fontSize: '0.73rem', padding: '0 0.75rem' }}
      >
        ⋮ Ações
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '0.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '180px',
          }}
        >
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.3rem 0.5rem', marginBottom: '0.25rem' }}>Status</p>
          {(['ativo', 'inativo', 'bloqueado'] as UserStatus[]).filter(s => s !== currentStatus).map(s => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, color: s === 'bloqueado' ? '#ff6b6b' : 'var(--text)',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Marcar como {s}
            </button>
          ))}
          <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.4rem 0' }} />
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0.3rem 0.5rem', marginBottom: '0.25rem' }}>Papel</p>
          {(['membro', 'mentor', 'editor', 'suporte', 'admin'] as UserRole[]).filter(r => r !== currentRole).map(r => (
            <button
              key={r}
              onClick={() => updateRole(r)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              Tornar {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
