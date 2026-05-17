'use client'

import { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import { createMemberAction } from '@/app/(protected)/admin/membros/actions'

export default function AddMemberModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await createMemberAction(new FormData(e.currentTarget))
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      setTimeout(() => { setOpen(false); setSuccess(false) }, 2000)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(''); setSuccess(false) }}
        className="btn-primary"
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
      >
        <UserPlus size={15} />
        Adicionar membro
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '2rem', width: '100%', maxWidth: '420px',
            position: 'relative',
          }}>
            <button
              onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
            >
              <X size={18} />
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.04em', marginBottom: '1.5rem' }}>
              Novo membro
            </h2>

            {success ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--green)', fontWeight: 700, marginBottom: '0.5rem' }}>Membro criado!</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Um e-mail foi enviado para o membro definir sua senha.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label className="field">
                  Nome completo
                  <input name="name" type="text" placeholder="João Silva" required />
                </label>
                <label className="field">
                  E-mail
                  <input name="email" type="email" placeholder="joao@email.com" required />
                </label>
                <label className="field">
                  Função
                  <select name="role" style={{ background: 'var(--card-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', padding: '0.6rem 0.75rem', fontSize: '0.88rem' }}>
                    <option value="membro">Membro</option>
                    <option value="mentor">Mentor</option>
                    <option value="suporte">Suporte</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>

                {error && <p className="error-text">{error}</p>}

                <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: '0.5rem' }}>
                  {loading ? 'Criando...' : 'Criar e enviar convite'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
