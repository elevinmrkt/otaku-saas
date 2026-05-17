'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RecuperarSenhaPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/atualizar-senha`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <main style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '2rem', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(229,9,20,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%', maxWidth: '420px',
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)', padding: '2.5rem', position: 'relative',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
      }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <span style={{ width: '36px', height: '36px', background: 'var(--red)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'white' }}>OE</span>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>Otaku Estóico</strong>
          </div>
          <span className="label">Recuperação de acesso</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', letterSpacing: '0.04em', lineHeight: 1, color: 'var(--text)' }}>
            Recuperar senha
          </h1>
        </div>

        {sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--r)', padding: '1.25rem' }}>
              <strong style={{ color: 'var(--green)', display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
                Link enviado!
              </strong>
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Enviamos um link para <strong style={{ color: 'var(--text)' }}>{email}</strong>. Verifique sua caixa de entrada e também a pasta de spam.
              </p>
            </div>
            <Link href="/login" className="btn-primary" style={{ justifyContent: 'center' }}>
              Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Digite o e-mail cadastrado e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label className="field">
                E-mail
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" required />
              </label>
              {error && <p className="error-text">{error}</p>}
              <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>
            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)' }}>
              <Link href="/login" style={{ color: 'var(--gold)', fontWeight: 700 }}>Voltar ao login</Link>
            </p>
          </>
        )}
      </div>
    </main>
  )
}
