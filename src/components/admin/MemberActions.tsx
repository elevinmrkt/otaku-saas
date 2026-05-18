'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { deleteMemberAction, resendInviteAction } from '@/app/(protected)/admin/membros/actions'
import type { UserRole, UserStatus } from '@/types/database'

interface Props {
  memberId: string
  memberEmail: string
  currentStatus: UserStatus
  currentRole: UserRole
}

export default function MemberActions({ memberId, memberEmail, currentStatus, currentRole }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [accessLink, setAccessLink] = useState<string | null>(null)

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

  async function handleResend() {
    setLoading(true)
    setOpen(false)
    const result = await resendInviteAction(memberEmail)
    setLoading(false)
    if (typeof result === 'string') {
      setFeedback(result)
      setTimeout(() => setFeedback(null), 4000)
    } else {
      setAccessLink(result.link)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir ${memberEmail} permanentemente? Todos os dados serão apagados.`)) return
    setLoading(true)
    setOpen(false)
    const err = await deleteMemberAction(memberId)
    setLoading(false)
    if (err) { setFeedback(err); setTimeout(() => setFeedback(null), 4000); return }
    router.refresh()
  }

  if (accessLink) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '1.5rem', width: '100%', maxWidth: '500px',
          }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              Link de acesso gerado
            </strong>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              Envie esse link diretamente ao membro ({memberEmail}). Ele expira em 24h e é de uso único.
            </p>
            <div style={{
              background: 'var(--card-2)', border: '1px solid var(--border)',
              borderRadius: '6px', padding: '0.75rem', fontSize: '0.72rem',
              color: 'var(--muted)', wordBreak: 'break-all', marginBottom: '1rem',
            }}>
              {accessLink}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.82rem' }}
                onClick={() => { navigator.clipboard.writeText(accessLink); setFeedback('Copiado!'); setTimeout(() => setFeedback(null), 2000) }}
              >
                Copiar link
              </button>
              <button
                className="btn-ghost"
                style={{ fontSize: '0.82rem' }}
                onClick={() => setAccessLink(null)}
              >
                Fechar
              </button>
            </div>
            {feedback === 'Copiado!' && (
              <p style={{ color: 'var(--green)', fontSize: '0.78rem', marginTop: '0.5rem', textAlign: 'center' }}>
                ✓ Copiado para a área de transferência
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      {feedback && (
        <span style={{
          position: 'absolute', right: 0, bottom: 'calc(100% + 6px)', whiteSpace: 'nowrap',
          background: feedback.includes('enviado') ? 'rgba(37,211,102,0.12)' : 'rgba(255,107,107,0.12)',
          color: feedback.includes('enviado') ? 'var(--green)' : '#ff6b6b',
          border: `1px solid ${feedback.includes('enviado') ? 'rgba(37,211,102,0.3)' : 'rgba(255,107,107,0.3)'}`,
          borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, padding: '0.3rem 0.6rem', zIndex: 200,
        }}>
          {feedback}
        </span>
      )}
      <button
        className="btn-ghost sm"
        onClick={() => setOpen(o => !o)}
        disabled={loading}
        style={{ fontSize: '0.73rem', padding: '0 0.75rem' }}
      >
        {loading ? '...' : '⋮ Ações'}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: '0.5rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)', minWidth: '190px',
          }}>
            {/* Resend invite */}
            <button
              onClick={handleResend}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              ✉ Reenviar acesso
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.4rem 0' }} />

            {/* Status */}
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
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Marcar como {s}
              </button>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.4rem 0' }} />

            {/* Role */}
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
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--card-2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Tornar {r}
              </button>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0.4rem 0' }} />

            {/* Delete */}
            <button
              onClick={handleDelete}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '0.5rem 0.75rem', borderRadius: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '0.82rem', fontWeight: 600, color: '#ff6b6b',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,107,107,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              🗑 Excluir membro
            </button>
          </div>
        </>
      )}
    </div>
  )
}
